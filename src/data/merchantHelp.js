export const MERCHANT_HELP = [
  {
    id: 'start',
    title: 'Getting started',
    to: '/configuration',
    summary: 'Set up the property in this order so the booking site, calendar, and payments have the details they need.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Hofros is the merchant workspace for one property. Guests book on your direct website. You accept, assign, and follow those stays from Home, Bookings, and the Calendar.',
          'Nothing on the public site can be priced or reserved until an accommodation and at least one active room exist.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Property name, address, and contact details',
          'Each room or unit: name, type, beds, guest limit, nightly price, and currency',
          'How guests can pay: cash, GCash, bank transfer, or card',
          'The name guests should see on the booking website',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Advanced and save Profile. The merchant name is the name used on your booking link.',
          'Open Configuration, add an Accommodation, then add Rooms/Units and set each one to Active.',
          'On Availability / Base Rates, set the nightly price. On Unit Schedule, choose which weekdays can be booked.',
          'Open Advanced, then Payments, and turn on the methods you accept. Add the GCash or bank details guests should use.',
          'Open Booking Portals, connect Direct website, design the page, then Publish Website.',
          'Use Home each day for arrivals and departures. Use the Calendar to assign a room, check a guest in, and check a guest out.',
        ],
      },
    ],
  },
  {
    id: 'home',
    title: 'Home',
    to: '/dashboard',
    summary: 'The daily board: arrivals, departures, in-house guests, new bookings, and a 14-day outlook.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Home is the operating view for the selected day. Arrivals are check-ins for that day only. Departures are check-outs for that day. Stayovers and in-house guests are people already staying.',
          'The 14-day outlook shows how bookings are spread across the next two weeks. Move the day with the arrows, or refresh the board after you change a booking.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Bookings with a check-in date, check-out date, guest name, and status',
          'A room assignment before a guest can be treated as in-house',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Home. The heading shows the day you are looking at.',
          'Use the tabs for new bookings, arrivals, departures, stayovers, in-house guests, sales, cancellations, and overbookings.',
          'Search a guest from the list on the board.',
          'Use the arrows under the outlook to move one day at a time. Use Refresh after a check-in or a new reservation.',
          'Open the guest’s booking when you need the full record, or use the Calendar to check them in.',
        ],
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    to: '/calendar',
    summary: 'See which rooms are occupied, block dates, assign accepted stays, and check guests in or out.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Each row is a room. A bar across the dates is a stay. Click the bar to open the reservation: guest name, email, phone, dates, balance, and the assigned room.',
          'The Assignments list shows accepted bookings that still need a room. Pending bookings stay out of that list until you accept them.',
          'A blocked date is closed inventory. Guests cannot book a blocked room for those nights.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Rooms created under Configuration',
          'The guest’s stay dates if you are moving or assigning the booking',
          'Email and phone, which come from the booking form the guest filled in',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Calendar. Use Prev, Today, and Next to move the 21-day window.',
          'Click a booking bar. The popup shows check-in and check-out, email, phone, guests, grand total, and balance.',
          'Use Quick edit to open the full booking. Use Move to change the room or the dates.',
          'From the same popup, assign or un-assign the room, then Check-in or Check-out when the guest arrives or leaves.',
          'To place an accepted stay, select it under Assignments, choose a compatible room, and assign it. Auto assign all fills every accepted stay that has a free matching room.',
          'Use Block dates when a room must not be sold. Remove the block when the room is open again.',
        ],
      },
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings',
    to: '/bookings',
    summary: 'The reservation list. Create a stay yourself, or review a request that came from the direct website.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'A booking from the direct website arrives as Pending. You accept it, then assign a room on the Calendar. After the guest arrives it becomes Checked in, and after they leave it becomes Checked out.',
          'You can also create a booking for a walk-in or a phone call. The same guest details the public form collects are required here: name, email, and phone.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Guest name, email address, and phone number',
          'Check-in and check-out dates',
          'Adults and children',
          'The room, once the stay is accepted',
          'Status: Pending, Accepted, Assigned, Checked in, Checked out, or Cancelled',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Bookings. Filter by status or search by guest, reference, email, or phone.',
          'Open a row to see the full record, record a payment, or change the stay.',
          'To add a reservation yourself, create a booking and enter the guest name, email, phone, dates, and guest count.',
          'Set a website request to Accepted when you can host it. Then open the Calendar and assign a room.',
          'Cancel a stay you will not honor. Cancelled stays leave the active calendar.',
        ],
      },
    ],
  },
  {
    id: 'discount',
    title: 'Discount',
    to: '/discount',
    summary: 'Promo codes guests type at checkout, and automatic discounts that apply to a room.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Promo Codes are entered by the guest on the booking form. Each code is a percentage or a fixed amount, with a minimum number of nights and an optional maximum number of uses.',
          'Per Unit discounts apply by themselves. The types are Early Bird, Long Stay, Last Minute, Weekend Discount, and Date Range.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'The code guests will type, such as STAY10',
          'Percentage or fixed amount, minimum nights, and how many times the code may be used',
          'For a room discount: which unit, which type, and the dates or conditions',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Discount and stay on Promo Codes.',
          'Choose New Code. Enter the code, the discount type, the value, the minimum nights, and the use limit if you want one.',
          'Leave a code active only while you want guests to use it. The page shows active codes, total uses, and the average discount.',
          'Open Per Unit to add an automatic discount for one room. Delete a discount when the offer is over.',
        ],
      },
    ],
  },
  {
    id: 'messages',
    title: 'Messages',
    to: '/messages',
    summary: 'The inbox for guests who created a customer account and wrote to the property.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'A guest cannot send a message until they register or log in as a customer. That account is separate from your merchant login.',
          'The Message button is on the booking website and in the design preview. It stays hidden when Customer messages is turned off in the website design.',
          'The inbox refreshes about every 5 seconds, so a new guest message appears without reloading the page.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Customer messages turned on in the website design',
          'A published booking site if guests should write from the public page',
          'The guest’s customer account: full name, address, contact number, email, and password',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Messages. Each row is one customer.',
          'Select the customer to read the thread. Opening it marks their messages as read.',
          'Type a reply and send it. The guest sees it in the Message panel on the website.',
          'To stop new messages, open the website design, go to Sections, and turn Customer messages off.',
        ],
      },
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    to: '/customers',
    summary: 'The list of customer accounts that have messaged this property.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'A customer account is created by the guest from the Message panel. It is not a merchant user and it does not appear here until that guest has sent you a message.',
          'The list shows the details they entered at registration. Passwords are never shown.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Full name',
          'Address',
          'Contact number',
          'Email address',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Customers.',
          'Search by name, address, contact number, or email.',
          'Use Messages when you want to reply. Customers is the directory; Messages is the conversation.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    to: '/analytics',
    summary: 'Revenue, bookings, and occupancy for a year, with a CSV export.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Figures are grouped by the stay’s check-in period. Change the year, then switch the chart between daily, weekly, monthly, and yearly.',
          'The cards show total revenue, booking count, and average occupancy, each compared with the previous year.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Bookings with a price, currency, check-in date, and a status that counts as a stay',
          'The year you want to review',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Analytics and choose the year.',
          'Select daily, weekly, monthly, or yearly to change the chart.',
          'Export a CSV of the bookings for that year and granularity when you need the rows in a spreadsheet.',
        ],
      },
    ],
  },
  {
    id: 'portals',
    title: 'Booking Portals',
    to: '/bookingportals',
    summary: 'Connect the direct booking website and any other channel Hofros lists for this property.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Booking Portals is the list of sales channels. Direct website is your own Hofros page. A channel is either connected or not, and a connected channel can be set active.',
          'Guests only see a published direct website. Connecting it is not the same as publishing the design.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'An accommodation and at least one active room',
          'A finished website design if you are opening the direct site',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Booking Portals and review Connected channels.',
          'Connect Direct website if it is not connected yet.',
          'Open the website builder from that channel to design the page, save, and publish.',
          'Use the channel’s active switch when you want to pause a connected portal without removing it.',
        ],
      },
    ],
  },
  {
    id: 'website',
    title: 'Website builder',
    to: '/direct-portal-design',
    summary: 'Design the public booking page, choose what guests see, and publish it.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'The builder has three tabs. Design picks the template, colors, and hero photo. Content is the words guests read. Sections turns page blocks on or off, including Customer messages.',
          'Templates are layouts, not just colors. Basic, Advance, Professional, and Premium are different structures. The crown appears only in the Premium template list.',
          'Save Draft keeps the work. Finish for testing prepares a preview. Publish Website makes the page live at your /directportal address. The button reads Live after it is published.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Business name, headline, and short description',
          'Phone, email, and address if you show the contact bar',
          'A hero photo, either from the library or uploaded',
          'A template and brand colors',
          'Whether guests may message you',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open the builder from Booking Portals. On Design, choose a template, then adjust colors and the hero photo if you want.',
          'Use Desktop and Mobile in the preview. The phone frame is the layout guests see on a small screen.',
          'Open Content and write the headline and description.',
          'Open Sections and turn on only the blocks you want. Leave Customer messages on if guests should be able to write to you.',
          'Save Draft while you work. Publish Website when the page should accept public visits.',
          'On the live page, a guest chooses dates, picks a room, and enters their name, mobile number, and email. A promo code is optional.',
        ],
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    to: '/configuration',
    summary: 'The property setup: accommodation, rooms, prices, weekly schedule, alerts, and access.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Configuration is where inventory is defined. An accommodation is the property. Rooms/Units are what guests book. A room must be Active to appear on the booking site.',
          'Base rates are the nightly prices. Rate intervals can change that price for a date range or for selected weekdays. Unit Schedule closes specific weekdays.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Accommodation name and address',
          'Room name, type, bedrooms, beds, maximum guests, price per night, and currency (PHP, USD, EUR, or GBP)',
          'Which weekdays the room can be booked',
          'Any seasonal or weekday rate that should replace the base price',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Accommodation and add the property before you add rooms.',
          'Open Rooms/Units, add each room, and set the status to Active.',
          'Open Availability / Base Rates, choose the accommodation, and save the nightly price for each room.',
          'Add a rate interval when a season or a set of weekdays has a different price.',
          'Open Unit Schedule and turn off weekdays that must not be sold.',
          'Use Alerts and Access for the warnings and entry settings stored on this page.',
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    to: '/advance',
    summary: 'Merchant profile, password, staff users, payment methods, and notification switches.',
    sections: [
      {
        heading: 'How it works',
        paragraphs: [
          'Advanced is the account around the property. Profile is your business identity. Security changes the merchant password. Users are staff who help run the account, with the roles Admin, Manager, and Staff.',
          'Payments controls what you tell guests about paying. Notifications chooses which events you want to be told about.',
        ],
      },
      {
        heading: 'Information you need',
        items: [
          'Profile: merchant name, your name, contact number, address, and email',
          'Security: the current password and a new password',
          'Users: name, email, and role',
          'Payments: cash, GCash, bank transfer, or card; GCash name and number; bank name, account name, and account number; currency; deposit percent; instructions',
          'Notifications: new booking, cancellation, check-in, check-out, payment, and review',
        ],
      },
      {
        heading: 'How to do it',
        steps: [
          'Open Advanced and select Profile. Save the merchant name guests should see.',
          'Open Security to change the password.',
          'Open Users to add a teammate and set Admin, Manager, or Staff. Change the role later, or remove someone who should no longer sign in.',
          'Open Payments. Turn on each method you accept. If GCash or bank transfer is on, fill in the account details and any deposit rule, then save.',
          'Open Notifications and turn on the events you want, then save.',
        ],
      },
    ],
  },
]
