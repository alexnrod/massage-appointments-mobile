export type BookingStatus = 'pending' | 'accepted' | 'declined';

export interface WorkingDay {
  id: string;
  start_time: string;
  end_time: string;
  city: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_telegram: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  address: string | null;
  booking_start: string | null;
  status: BookingStatus;
  note: string | null;
  created_at: string;
  slot: WorkingDay;
}

export interface Break {
  id: string;
  date: string;
  type: string;
  custom_start: string | null;
  custom_end: string | null;
}

export interface HotNews {
  content: string;
}
