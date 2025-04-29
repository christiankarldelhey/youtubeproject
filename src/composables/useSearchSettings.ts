import { Utensils, Bed, Tent, CircleDollarSign, MapIcon, Scroll } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

export function useSearchSettings() {

    const iconMap = {
        MapIcon,
        Utensils,
        Bed,
        Tent,
        CircleDollarSign,
        Scroll,
    };

    const { t } = useI18n();
    const searchOptions = [
        { value: 'travel', label: t('travel'), icon: 'MapIcon' },
        { value: 'food', label: t('food'), icon: 'Utensils' },
        { value: 'hotel', label: t('hotel'), icon: 'Bed' },
        { value: 'hiking', label: t('hiking'), icon: 'Tent' },
        { value: 'budget', label: t('budget'), icon: 'CircleDollarSign' },
        { value: 'history', label: t('history'), icon: 'Scroll' },
      ];

    return {
        searchOptions,
        iconMap,
    };
}
