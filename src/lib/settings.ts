import Storage from 'expo-sqlite/kv-store';

// Settings that live only on this phone.
export const adminName = () => Storage.getItemSync('admin_name') ?? '';
export const setAdminName = (name: string) => Storage.setItemSync('admin_name', name.trim());

export const seenMilestones = (): string[] => JSON.parse(Storage.getItemSync('seen_milestones') ?? '[]');
export const markMilestonesSeen = (ids: string[]) => Storage.setItemSync('seen_milestones', JSON.stringify(ids));

export const batteryHintDone = () => Storage.getItemSync('battery_hint_done') === '1';
export const setBatteryHintDone = () => Storage.setItemSync('battery_hint_done', '1');
