import Storage from 'expo-sqlite/kv-store';

// Settings that live only on this phone.
export const adminName = () => Storage.getItemSync('admin_name') ?? '';
export const setAdminName = (name: string) => Storage.setItemSync('admin_name', name.trim());

export const seenMilestones = (): string[] => JSON.parse(Storage.getItemSync('seen_milestones') ?? '[]');
export const markMilestonesSeen = (ids: string[]) => Storage.setItemSync('seen_milestones', JSON.stringify(ids));

// The birthday opens on Статистика once; later starts that day keep the usual first tab.
export const birthdayShown = () => Storage.getItemSync('birthday_shown') === '2026';
export const setBirthdayShown = () => Storage.setItemSync('birthday_shown', '2026');
