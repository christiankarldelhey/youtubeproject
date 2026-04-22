import axios from 'axios'
import type { FetchPoisParams, OverpassElement, OverpassResponse, PoiMarker } from '../model/poi.types'

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const POI_DEDUPE_CELL_SIZE_DEG = 0.001

type TopicFilterRule = {
  key: string
  values?: string[]
  any?: boolean
}

const topicFilterMap: Record<string, TopicFilterRule[]> = {
  travel: [
    { key: 'tourism', values: ['attraction', 'viewpoint', 'museum', 'gallery', 'theme_park'] },
    { key: 'historic', any: true },
  ],
  food: [{ key: 'amenity', values: ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court'] }],
  hotel: [{ key: 'tourism', values: ['hotel', 'hostel', 'guest_house', 'apartment', 'motel'] }],
  hiking: [
    { key: 'highway', values: ['path', 'footway', 'track'] },
    { key: 'natural', values: ['peak', 'wood', 'cliff', 'spring'] },
    { key: 'leisure', values: ['nature_reserve'] },
  ],
  budget: [
    { key: 'amenity', values: ['marketplace', 'bus_station'] },
    { key: 'shop', values: ['supermarket', 'convenience'] },
    { key: 'tourism', values: ['hostel'] },
  ],
  history: [
    { key: 'historic', values: ['monument', 'castle', 'ruins', 'archaeological_site', 'memorial'] },
    { key: 'tourism', values: ['museum'] },
  ],
}

const overpassRuleFragment = (rule: TopicFilterRule): string => {
  if (rule.any) {
    return `["${rule.key}"]`
  }

  if (!rule.values?.length) {
    return ''
  }

  const regexValues = rule.values.join('|')
  return `["${rule.key}"~"^(${regexValues})$"]`
}

const buildOverpassQuery = (
  [south, west, north, east]: [number, number, number, number],
  topic?: string,
) => {
  const topicRules = topic ? topicFilterMap[topic] : undefined
  const rules = topicRules?.length
    ? topicRules
    : [{ key: 'amenity', any: true }, { key: 'tourism', any: true }, { key: 'historic', any: true }]

  const queryParts = rules
    .map(overpassRuleFragment)
    .filter((fragment) => fragment.length > 0)
    .flatMap((fragment) => [
      `node${fragment}(${south},${west},${north},${east});`,
      `way${fragment}(${south},${west},${north},${east});`,
      `relation${fragment}(${south},${west},${north},${east});`,
    ])
    .join('\n  ')

  return `[out:json][timeout:25];\n(\n  ${queryParts}\n);\nout center;`
}

const extractCoordinates = (element: OverpassElement): [number, number] | null => {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return [element.lat, element.lon]
  }

  if (element.center?.lat !== undefined && element.center?.lon !== undefined) {
    return [element.center.lat, element.center.lon]
  }

  return null
}

const toPoiMarker = (element: OverpassElement): PoiMarker | null => {
  const position = extractCoordinates(element)
  if (!position) {
    return null
  }

  const [lat, lng] = position
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  const tags = element.tags ?? {}
  const name = tags.name ?? tags.brand ?? tags.operator ?? 'Unknown POI'
  const primaryTag = Object.entries(tags).find(([key]) =>
    ['amenity', 'tourism', 'leisure', 'historic', 'shop', 'natural'].includes(key),
  )?.[1]

  const description =
    tags.description ??
    tags.tourism ??
    tags.amenity ??
    tags.shop ??
    tags.historic ??
    tags.leisure ??
    tags.natural ??
    'No description available'

  return {
    id: `${element.type}-${element.id}`,
    position: [lat, lng],
    name,
    description,
    primaryTag,
    source: 'osm',
  }
}

const dedupePoisByGrid = (markers: PoiMarker[], cellSizeDeg = POI_DEDUPE_CELL_SIZE_DEG): PoiMarker[] => {
  const seenCells = new Set<string>()

  return markers.filter((marker) => {
    const [lat, lng] = marker.position
    const latCell = Math.floor(lat / cellSizeDeg)
    const lngCell = Math.floor(lng / cellSizeDeg)
    const cellKey = `${latCell}:${lngCell}`

    if (seenCells.has(cellKey)) {
      return false
    }

    seenCells.add(cellKey)
    return true
  })
}

export const fetchPoisInBbox = async ({
  bbox,
  topic,
  timeoutMs = 15000,
  maxResults = 180,
}: FetchPoisParams): Promise<PoiMarker[]> => {
  const query = buildOverpassQuery(bbox, topic)

  const { data } = await axios.post<OverpassResponse>(OVERPASS_ENDPOINT, query, {
    headers: {
      'Content-Type': 'text/plain',
    },
    timeout: timeoutMs,
  })

  return dedupePoisByGrid(
    data.elements
    .map(toPoiMarker)
    .filter((poi): poi is PoiMarker => poi !== null),
  ).slice(0, maxResults)
}
