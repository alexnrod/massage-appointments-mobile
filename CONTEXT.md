# Massage appointments admin

Clients book massage sessions with one therapist; a single admin confirms those bookings and maintains the therapist's calendar.

## People

**Therapist**:
Vyacheslav, the only person who gets booked.
_Avoid_: Master, specialist

**Admin**:
The single person, separate from the therapist, who approves bookings and fills out the calendar.
_Avoid_: Manager, operator, user

**Client**:
A person who books a session through the public website.
_Avoid_: Customer, patient

## Bookings

**Booking**:
A client's request for a session at a specific time with the therapist.
_Avoid_: Appointment, reservation, slot

**Pending**:
A booking awaiting the admin's decision, either new or rebooked by the client.

**Accepted**:
A booking the admin has approved.

**Declined**:
A booking the admin rejected or the client cancelled.
_Avoid_: Cancelled, rejected

## Schedule

**Working day**:
A day the admin opens for bookings, in one city, from 10:00 to 21:00.
_Avoid_: Slot, availability

**Break**:
A period on a given date that the admin blocks from booking: the whole day, the morning, the evening or a custom range.
_Avoid_: Block, blocked period
