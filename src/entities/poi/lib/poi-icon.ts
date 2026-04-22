import L from 'leaflet'

const topicEmojiMap: Record<string, string> = {
  travel: '✈️',
  food: '🍽️',
  hotel: '🏨',
  hiking: '🥾',
  budget: '💸',
  history: '🏛️',
}

export const getPoiTopicEmoji = (topic: string): string => {
  return topicEmojiMap[topic] ?? '📍'
}

export const getPoiTopicIcon = (topic: string): L.DivIcon => {
  const emoji = getPoiTopicEmoji(topic)

  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#6639de;color:white;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);font-size:14px;">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  })
}
