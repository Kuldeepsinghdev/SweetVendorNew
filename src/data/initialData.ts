import { MasterSweet, City, SaleCenter, DistributionCenter, SaleCenterSweet, MitraApplication, Festival, Booking, AuditLog, NotificationTemplate, DiscountCoupon } from '../types';

export const INITIAL_FESTIVALS: Festival[] = [
  {
    id: 'diwali_2026',
    nameHi: 'दीपावली 2026',
    nameEn: 'Diwali 2026',
    status: 'active',
    startDate: '2026-10-10',
    cutoffDate: '2026-11-02',
    distributionStartDate: '2026-11-07',
    distributionEndDate: '2026-11-09',
    maxKgPerBooking: 15,
    defaultMitraCreditLimit: 25000,
  }
];

export const INITIAL_MASTER_SWEETS: MasterSweet[] = [
  {
    id: 'kaju_katli_no_vark',
    nameHi: 'काजू कतली (बिना वर्क)',
    nameEn: 'Kaju Katli (Without Vark)',
    category: 'dry',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'गाय के देशी घी द्वारा निर्मित शुद्ध काजू कतली (बिना वर्क)',
    descriptionEn: 'Pure cow desi ghee kaju katli (without silver vark)',
    imageUrl: 'https://th.bing.com/th/id/OIP.p95T_AH9o_AbCgDM1Ie4ZAHaE8?w=275&h=184&c=7&r=0&o=7&pid=1.7&rm=3',
    images: [
      'https://th.bing.com/th/id/OIP.p95T_AH9o_AbCgDM1Ie4ZAHaE8?w=275&h=184&c=7&r=0&o=7&pid=1.7&rm=3',
      '/images/kaju_katli_dmb_1785830397687.jpg',
      '/images/kaju_katli_local.jpg'
    ],
    basePrice: 700,
    shelfLifeDays: 20,
    packSizeInfo: '1 किग्रा (₹700) एवं आधा किग्रा (₹360)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 700 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 360 }
    ],
    isPureVeg: true,
    ingredientsHi: 'काजू, चीनी, गाय का देशी घी (बिना वर्क)'
  },
  {
    id: 'moong_barfi',
    nameHi: 'मूंग बर्फी',
    nameEn: 'Moong Burfi',
    category: 'traditional',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'गाय के देशी घी द्वारा निर्मित स्वादिष्ट एवं शुद्ध मूंग दाल बर्फी',
    descriptionEn: 'Delicious moong dal barfi prepared with pure cow desi ghee',
    imageUrl: 'https://anandams.com/wp-content/uploads/2024/01/Moong-Dal-Burfi-scaled.jpg',
    images: [
      'https://anandams.com/wp-content/uploads/2024/01/Moong-Dal-Burfi-scaled.jpg',
      '/images/moong_barfi_local.jpg'
    ],
    basePrice: 460,
    shelfLifeDays: 15,
    packSizeInfo: '1 किग्रा (₹460) एवं आधा किग्रा (₹240)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 460 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 240 }
    ],
    isPureVeg: true,
    ingredientsHi: 'धुली मूंग दाल, गाय का देशी घी, चीनी, मावा, इलायची, बादाम-पिस्ता'
  },
  {
    id: 'mathri',
    nameHi: 'मठरी (खस्ता मठरी)',
    nameEn: 'Mathri (Khasta Mathri)',
    category: 'traditional',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'गाय के देशी घी व शुद्ध मसालों से निर्मित खस्ता मठरी',
    descriptionEn: 'Crispy flaky mathri prepared with pure cow desi ghee & spices',
    imageUrl: 'https://resize.indiatv.in/resize/newbucket/1200_675/2026/02/mt-1771412570.webp',
    images: [
      'https://resize.indiatv.in/resize/newbucket/1200_675/2026/02/mt-1771412570.webp',
      '/images/mathri_local.jpg'
    ],
    basePrice: 280,
    shelfLifeDays: 45,
    packSizeInfo: '1 किग्रा (₹280) एवं आधा किग्रा (₹140)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 280 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 140 }
    ],
    isPureVeg: true,
    ingredientsHi: 'मैदा, गाय का देशी घी, अजवाइन, काली मिर्च, सेंधा नमक'
  },
  {
    id: 'kesar_ghevar',
    nameHi: 'शाही केसर घेवर (देशी घी)',
    nameEn: 'Shahi Kesar Ghevar (Desi Ghee)',
    category: 'traditional',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'शुद्ध गाय के देशी घी, जाफरान एवं पिस्ता-बादाम से सुसज्जित प्रसिद्ध घेवर',
    descriptionEn: 'Authentic royal saffron Ghevar prepared in pure desi cow ghee with dry fruits',
    imageUrl: '/images/kesar_ghevar_1785741274079.jpg',
    images: [
      '/images/kesar_ghevar_1785741274079.jpg'
    ],
    basePrice: 580,
    shelfLifeDays: 10,
    packSizeInfo: '1 किग्रा (₹580) एवं आधा किग्रा (₹300)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 580 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 300 }
    ],
    isPureVeg: true,
    ingredientsHi: 'मैदा, गाय का देशी घी, चीनी, केसर, बादाम, पिस्ता, इलायची'
  },
  {
    id: 'besan_ladoo',
    nameHi: 'शुद्ध बेसन लड्डू (पिस्ता-बादाम)',
    nameEn: 'Shuddha Besan Ladoo (Dry Fruits)',
    category: 'traditional',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'मोटे दरदरे बेसन, शुद्ध गाय के घी और इलायची-मेवों से बने पारंपरिक लड्डू',
    descriptionEn: 'Traditional granular gram flour ladoos loaded with pure ghee, almonds & pistachios',
    imageUrl: '/images/besan_ladoo_1785741256634.jpg',
    images: [
      '/images/besan_ladoo_1785741256634.jpg'
    ],
    basePrice: 420,
    shelfLifeDays: 30,
    packSizeInfo: '1 किग्रा (₹420) एवं आधा किग्रा (₹220)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 420 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 220 }
    ],
    isPureVeg: true,
    ingredientsHi: 'चना दाल बेसन, गाय का देशी घी, बूरा/खांड, इलायची, बादाम कतरन'
  },
  {
    id: 'motichoor_ladoo',
    nameHi: 'मोतीचूर के लड्डू (शुद्ध घी)',
    nameEn: 'Motichoor Ladoo (Pure Desi Ghee)',
    category: 'traditional',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'बारीक केसरिया बूंदी एवं शुद्ध देशी घी में तैयार मनमोहक मोतीचूर लड्डू',
    descriptionEn: 'Mouthwatering fine pearl boondi ladoos made in pure cow desi ghee with saffron',
    imageUrl: '/images/motichoor_ladoo_dmb_1785830283483.jpg',
    images: [
      '/images/motichoor_ladoo_dmb_1785830283483.jpg'
    ],
    basePrice: 380,
    shelfLifeDays: 12,
    packSizeInfo: '1 किग्रा (₹380) एवं आधा किग्रा (₹200)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 380 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 200 }
    ],
    isPureVeg: true,
    ingredientsHi: 'बेसन बूंदी, गाय का देशी घी, चीनी की चाशनी, केसर, मगज बीज'
  },
  {
    id: 'alwar_milk_cake',
    nameHi: 'प्रसिद्ध अलवर मिल्क केक',
    nameEn: 'Famous Alwar Milk Cake',
    category: 'mawa',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'शुद्ध ताजे दूध और दानेदार खोये से निर्मित राजस्थान का प्रसिद्ध कलाकंद/मिल्क केक',
    descriptionEn: 'Iconic caramelized granular milk cake prepared from farm-fresh cow milk & khoya',
    imageUrl: '/images/milk_cake_dmb_1785830317278.jpg',
    images: [
      '/images/milk_cake_dmb_1785830317278.jpg'
    ],
    basePrice: 480,
    shelfLifeDays: 14,
    packSizeInfo: '1 किग्रा (₹480) एवं आधा किग्रा (₹250)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 480 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 250 }
    ],
    isPureVeg: true,
    ingredientsHi: 'ताजा गाय का दूध, शुद्ध दानेदार मावा, चीनी, इलायची, देशी घी'
  },
  {
    id: 'gulab_jamun',
    nameHi: 'शाही गुलाब जामुन (देशी घी मावा)',
    nameEn: 'Shahi Gulab Jamun (Desi Ghee Mawa)',
    category: 'bengali',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'शुद्ध खोया व देशी घी में तले, इलायची व गुलाब जल चाशनी में डूबे गुलाब जामुन',
    descriptionEn: 'Juicy khoya dumplings deep fried in pure ghee and soaked in aromatic cardamom syrup',
    imageUrl: '/images/gulab_jamun_1785741287674.jpg',
    images: [
      '/images/gulab_jamun_1785741287674.jpg'
    ],
    basePrice: 440,
    shelfLifeDays: 10,
    packSizeInfo: '1 किग्रा (₹440) एवं आधा किग्रा (₹230)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 440 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 230 }
    ],
    isPureVeg: true,
    ingredientsHi: 'शुद्ध हरियाली मावा, पनीर, देशी घी, चीनी, गुलाब अर्क, इलायची'
  },
  {
    id: 'bikaneri_rasgulla',
    nameHi: 'बीकानेरी स्पंज रसगुल्ला',
    nameEn: 'Bikaneri Sponge Rasgulla',
    category: 'bengali',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'गाय के शुद्ध ताजे छैने से निर्मित कोमल, रसदार एवं स्वादिष्ट बीकानेरी रसगुल्ले',
    descriptionEn: 'Soft spongy cottage cheese balls soaked in light clarified sugar syrup',
    imageUrl: '/images/rasgulla_dmb_1785830458412.jpg',
    images: [
      '/images/rasgulla_dmb_1785830458412.jpg'
    ],
    basePrice: 340,
    shelfLifeDays: 8,
    packSizeInfo: '1 किग्रा (₹340) एवं आधा किग्रा (₹180)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 340 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 180 }
    ],
    isPureVeg: true,
    ingredientsHi: 'गाय का ताजा छैना (पनीर), चीनी, गुलाब जल'
  },
  {
    id: 'mix_dry_fruit_bites',
    nameHi: 'पंचमेवा ड्राई फ्रूट बाइट्स (बिना चीनी)',
    nameEn: 'Panchmewa Dry Fruit Bites (Sugar Free)',
    category: 'dry',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'काजू, बादाम, पिस्ता, अंजीर व खजूर से निर्मित स्वास्थ्यवर्धक व स्वादिष्ट बाइट्स',
    descriptionEn: 'Premium sugar-free bites made with cashew, almond, pistachio, fig and dates',
    imageUrl: '/images/mix_dry_fruits_1785741241492.jpg',
    images: [
      '/images/mix_dry_fruits_1785741241492.jpg'
    ],
    basePrice: 950,
    shelfLifeDays: 45,
    packSizeInfo: '1 किग्रा (₹950) एवं आधा किग्रा (₹490)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 950 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 490 }
    ],
    isPureVeg: true,
    ingredientsHi: 'काजू, बादाम, पिस्ता, खजूर पल्प, अंजीर, गाय का देशी घी'
  },
  {
    id: 'kesar_rasmalai',
    nameHi: 'शाही केसर रसमलाई',
    nameEn: 'Shahi Kesar Rasmalai',
    category: 'bengali',
    hsnCode: '2106',
    gstPercent: 5,
    descriptionHi: 'ताजे छैने व केसरिया बादाम-पिस्ता युक्त गाढ़े रबड़ी दूध से तैयार रसमलाई',
    descriptionEn: 'Soft paneer discs immersed in thick saffron cardamom milk with slivered nuts',
    imageUrl: '/images/kesar_rasmalai_dmb_1785830333876.jpg',
    images: [
      '/images/kesar_rasmalai_dmb_1785830333876.jpg'
    ],
    basePrice: 520,
    shelfLifeDays: 4,
    packSizeInfo: '1 किग्रा (₹520) एवं आधा किग्रा (₹270)',
    variants: [
      { label: '1 kg (एक किलो)', weightInKg: 1.0, price: 520 },
      { label: '500g (आधा किलो)', weightInKg: 0.5, price: 270 }
    ],
    isPureVeg: true,
    ingredientsHi: 'गाय का ताजा छैना, गाढ़ा दूध, केसर, पिस्ता, बादाम, इलायची'
  }
];

export const INITIAL_CITIES: City[] = [
  {
    id: 'sawai_madhopur',
    nameHi: 'सवाई माधोपुर',
    nameEn: 'Sawai Madhopur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'सवाई माधोपुर',
    adminName: 'केशव बचत एवं साख सहकारी समिति',
    adminPhone: '9413753383',
    isActive: true,
    sweets: [
      { sweetId: 'kaju_katli_no_vark', pricePerKg: 700, isActive: true },
      { sweetId: 'moong_barfi', pricePerKg: 460, isActive: true },
      { sweetId: 'mathri', pricePerKg: 280, isActive: true }
    ]
  },
  {
    id: 'jaipur',
    nameHi: 'जयपुर',
    nameEn: 'Jaipur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'जयपुर',
    adminName: 'जयपुर ज़िला सहकारी उपभोक्ता होलसेल भंडार',
    adminPhone: '9829012345',
    isActive: false,
    sweets: [
      { sweetId: 'kesar_ghevar', pricePerKg: 580, isActive: true },
      { sweetId: 'motichoor_ladoo', pricePerKg: 380, isActive: true },
      { sweetId: 'kaju_katli_no_vark', pricePerKg: 720, isActive: true }
    ]
  },
  {
    id: 'kota',
    nameHi: 'कोटा',
    nameEn: 'Kota',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'कोटा',
    adminName: 'हाड़ौती सहकार मिष्ठान समिति',
    adminPhone: '9414123456',
    isActive: false,
    sweets: [
      { sweetId: 'besan_ladoo', pricePerKg: 420, isActive: true },
      { sweetId: 'moong_barfi', pricePerKg: 450, isActive: true },
      { sweetId: 'mathri', pricePerKg: 270, isActive: true }
    ]
  },
  {
    id: 'jodhpur',
    nameHi: 'जोधपुर',
    nameEn: 'Jodhpur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'जोधपुर',
    adminName: 'मारवाड़ सहकार संघ',
    adminPhone: '9414234567',
    isActive: false,
    sweets: [
      { sweetId: 'gulab_jamun', pricePerKg: 440, isActive: true },
      { sweetId: 'mix_dry_fruit_bites', pricePerKg: 950, isActive: true },
      { sweetId: 'kaju_katli_no_vark', pricePerKg: 700, isActive: true }
    ]
  },
  {
    id: 'alwar',
    nameHi: 'अलवर',
    nameEn: 'Alwar',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'अलवर',
    adminName: 'मत्स्य सहकार उपभोक्ता भंडार',
    adminPhone: '9414345678',
    isActive: false,
    sweets: [
      { sweetId: 'alwar_milk_cake', pricePerKg: 480, isActive: true },
      { sweetId: 'motichoor_ladoo', pricePerKg: 380, isActive: true },
      { sweetId: 'mathri', pricePerKg: 280, isActive: true }
    ]
  },
  {
    id: 'bikaner',
    nameHi: 'बीकानेर',
    nameEn: 'Bikaner',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    districtHi: 'बीकानेर',
    adminName: 'बीकानेर सहकार मिष्ठान भंडार',
    adminPhone: '9414456789',
    isActive: false,
    sweets: [
      { sweetId: 'bikaneri_rasgulla', pricePerKg: 340, isActive: true },
      { sweetId: 'kesar_ghevar', pricePerKg: 560, isActive: true },
      { sweetId: 'besan_ladoo', pricePerKg: 410, isActive: true }
    ]
  }
];

export const INITIAL_SALE_CENTERS: SaleCenter[] = [
  {
    id: 'kendra_aastha_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'आस्था उपभोक्ता भण्डार',
    nameEn: 'Aastha Upbhokta Bhandar',
    type: 'standalone',
    ownerName: 'केशव बचत एवं साख सहकारी समिति',
    ownerPhone: '9413753383',
    ownerEmail: 'aastha.bhandar.swm@gmail.com',
    addressHi: 'बजरिया टोंक रोड़, बजरिया स. माधोपुर',
    addressEn: 'Bajariya Tonk Road, Bajariya, Sawai Madhopur, Rajasthan',
    pincode: '322001',
    timing: '09:00 AM - 08:30 PM',
    mapUrl: 'https://maps.google.com/?q=Tonk+Road+Sawai+Madhopur',
    isActive: true,
    gstin: '08AAAAK4833E1ZV'
  },
  {
    id: 'kendra_malviya_nagar_jaipur',
    cityId: 'jaipur',
    nameHi: 'सहकार केंद्र — मालवीय नगर',
    nameEn: 'Sahakar Kendra — Malviya Nagar',
    type: 'standalone',
    ownerName: 'जयपुर ज़िला सहकारी उपभोक्ता होलसेल भंडार',
    ownerPhone: '9829012345',
    ownerEmail: 'jaipur.malviya@sahakar.org',
    addressHi: 'सेक्टर 3, मुख्य बाज़ार, मालवीय नगर, जयपुर',
    addressEn: 'Sector 3, Main Market, Malviya Nagar, Jaipur',
    pincode: '302017',
    timing: '09:30 AM - 08:30 PM',
    mapUrl: 'https://maps.google.com/?q=Malviya+Nagar+Jaipur',
    isActive: true,
    gstin: '08AAACJ1234F1Z1'
  },
  {
    id: 'kendra_bajariya_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'सहकार केंद्र — बजरिया',
    nameEn: 'Sahakar Kendra — Bajariya',
    type: 'standalone',
    ownerName: 'केशव बचत एवं साख सहकारी समिति',
    ownerPhone: '9875168011',
    ownerEmail: 'bajariya.sawai@sahakar.org',
    addressHi: 'मुख्य बाजार, बजरिया, सवाई माधोपुर',
    addressEn: 'Main Market, Bajariya, Sawai Madhopur, Rajasthan',
    pincode: '322001',
    timing: '09:00 AM - 08:00 PM',
    mapUrl: 'https://maps.google.com/?q=Bajariya+Sawai+Madhopur',
    isActive: true,
    gstin: '08AAACS9012B1Z2'
  },
  {
    id: 'kendra_rajapark_jaipur',
    cityId: 'jaipur',
    nameHi: 'सहकार केंद्र — राजापार्क',
    nameEn: 'Sahakar Kendra — Raja Park',
    type: 'standalone',
    ownerName: 'जयपुर ज़िला सहकारी उपभोक्ता होलसेल भंडार',
    ownerPhone: '9829054321',
    ownerEmail: 'jaipur.rajapark@sahakar.org',
    addressHi: 'गली नं. 4, राजापार्क, जयपुर',
    addressEn: 'Lane No. 4, Raja Park, Jaipur',
    pincode: '302004',
    timing: '09:00 AM - 08:00 PM',
    mapUrl: 'https://maps.google.com/?q=Raja+Park+Jaipur',
    isActive: true,
    gstin: '08AAACJ1234F1Z2'
  },
  {
    id: 'kendra_gumanpura_kota',
    cityId: 'kota',
    nameHi: 'सहकार मिष्ठान केंद्र — गुमानपुरा',
    nameEn: 'Sahakar Kendra — Gumanpura',
    type: 'standalone',
    ownerName: 'हाड़ौती सहकार मिष्ठान समिति',
    ownerPhone: '9414123456',
    ownerEmail: 'kota.gumanpura@sahakar.org',
    addressHi: 'मुख्य बाज़ार, गुमानपुरा, कोटा',
    addressEn: 'Main Market, Gumanpura, Kota',
    pincode: '324007',
    timing: '09:00 AM - 08:30 PM',
    mapUrl: 'https://maps.google.com/?q=Gumanpura+Kota',
    isActive: true,
    gstin: '08AAACK5678G1Z3'
  },
  {
    id: 'kendra_shastri_jodhpur',
    cityId: 'jodhpur',
    nameHi: 'सहकार भंडार — शास्त्री नगर',
    nameEn: 'Sahakar Kendra — Shastri Nagar',
    type: 'standalone',
    ownerName: 'मारवाड़ सहकार संघ',
    ownerPhone: '9414234567',
    ownerEmail: 'jodhpur.shastri@sahakar.org',
    addressHi: 'शास्त्री सर्कल, शास्त्री नगर, जोधपुर',
    addressEn: 'Shastri Circle, Shastri Nagar, Jodhpur',
    pincode: '342003',
    timing: '09:30 AM - 08:30 PM',
    mapUrl: 'https://maps.google.com/?q=Shastri+Nagar+Jodhpur',
    isActive: true,
    gstin: '08AAACJ9876H1Z4'
  },
  {
    id: 'kendra_companybagh_alwar',
    cityId: 'alwar',
    nameHi: 'सहकार वितरण केंद्र — कंपनी बाग',
    nameEn: 'Sahakar Kendra — Company Bagh',
    type: 'standalone',
    ownerName: 'मत्स्य सहकार उपभोक्ता भंडार',
    ownerPhone: '9414345678',
    ownerEmail: 'alwar.bagh@sahakar.org',
    addressHi: 'कंपनी बाग रोड, अलवर',
    addressEn: 'Company Bagh Road, Alwar',
    pincode: '301001',
    timing: '09:00 AM - 08:00 PM',
    mapUrl: 'https://maps.google.com/?q=Company+Bagh+Alwar',
    isActive: true,
    gstin: '08AAACA3456K1Z5'
  },
  {
    id: 'kendra_kotegate_bikaner',
    cityId: 'bikaner',
    nameHi: 'सहकार उपभोक्ता केंद्र — कोटगेट',
    nameEn: 'Sahakar Kendra — Kote Gate',
    type: 'standalone',
    ownerName: 'बीकानेर सहकार मिष्ठान भंडार',
    ownerPhone: '9414456789',
    ownerEmail: 'bikaner.kotegate@sahakar.org',
    addressHi: 'कोटगेट मुख्य मार्ग, बीकानेर',
    addressEn: 'Kote Gate Main Road, Bikaner',
    pincode: '334001',
    timing: '09:00 AM - 08:30 PM',
    mapUrl: 'https://maps.google.com/?q=Kote+Gate+Bikaner',
    isActive: true,
    gstin: '08AAACB7890L1Z6'
  }
];

// Per-sale-centre sweet menu + pricing. Seeded by expanding each city's
// configured sweets across every sale centre in that city. Each sale centre
// starts from its city's price list; operators can then edit per centre.
export const INITIAL_SALE_CENTER_SWEETS: SaleCenterSweet[] = INITIAL_SALE_CENTERS.flatMap((center) => {
  const city = INITIAL_CITIES.find((c) => c.id === center.cityId);
  return (city?.sweets || []).map((s) => ({
    saleCenterId: center.id,
    sweetId: s.sweetId,
    pricePerKg: s.pricePerKg,
    isActive: s.isActive,
  }));
});

export const INITIAL_DISTRIBUTION_CENTERS: DistributionCenter[] = [
  // --- Sawai Madhopur > Aastha Upbhokta Bhandar ---
  {
    id: 'dc_aastha_bajariya',
    saleCenterId: 'kendra_aastha_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'वितरण केंद्र — बजरिया चौराहा',
    nameEn: 'Distribution Centre — Bajariya Chauraha',
    addressHi: 'बजरिया चौराहा, टोंक रोड़, सवाई माधोपुर',
    addressEn: 'Bajariya Chauraha, Tonk Road, Sawai Madhopur',
    pincode: '322001',
    timing: '09:00 AM - 08:30 PM',
    phone: '9413753383',
    isActive: true
  },
  {
    id: 'dc_aastha_kherda',
    saleCenterId: 'kendra_aastha_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'वितरण केंद्र — खेरदा',
    nameEn: 'Distribution Centre — Kherda',
    addressHi: 'खेरदा मुख्य मार्ग, सवाई माधोपुर',
    addressEn: 'Kherda Main Road, Sawai Madhopur',
    pincode: '322021',
    timing: '09:30 AM - 08:00 PM',
    phone: '9413753384',
    isActive: true
  },
  {
    id: 'dc_aastha_alanpur',
    saleCenterId: 'kendra_aastha_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'वितरण केंद्र — आलनपुर',
    nameEn: 'Distribution Centre — Alanpur',
    addressHi: 'आलनपुर रोड, सवाई माधोपुर',
    addressEn: 'Alanpur Road, Sawai Madhopur',
    pincode: '322023',
    timing: '10:00 AM - 07:30 PM',
    phone: '9413753385',
    isActive: true
  },

  // --- Jaipur > Malviya Nagar ---
  {
    id: 'dc_malviya_sector3',
    saleCenterId: 'kendra_malviya_nagar_jaipur',
    cityId: 'jaipur',
    nameHi: 'वितरण केंद्र — सेक्टर 3',
    nameEn: 'Distribution Centre — Sector 3',
    addressHi: 'सेक्टर 3 मुख्य बाज़ार, मालवीय नगर, जयपुर',
    addressEn: 'Sector 3 Main Market, Malviya Nagar, Jaipur',
    pincode: '302017',
    timing: '09:30 AM - 08:30 PM',
    phone: '9829012345',
    isActive: true
  },
  {
    id: 'dc_malviya_sector7',
    saleCenterId: 'kendra_malviya_nagar_jaipur',
    cityId: 'jaipur',
    nameHi: 'वितरण केंद्र — सेक्टर 7',
    nameEn: 'Distribution Centre — Sector 7',
    addressHi: 'सेक्टर 7 सर्किल, मालवीय नगर, जयपुर',
    addressEn: 'Sector 7 Circle, Malviya Nagar, Jaipur',
    pincode: '302018',
    timing: '09:30 AM - 08:00 PM',
    phone: '9829012346',
    isActive: true
  },

  // --- Sawai Madhopur > Bajariya ---
  {
    id: 'dc_bajariya_mainmarket',
    saleCenterId: 'kendra_bajariya_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'वितरण केंद्र — मुख्य बाजार',
    nameEn: 'Distribution Centre — Main Market',
    addressHi: 'मुख्य बाजार, बजरिया, सवाई माधोपुर',
    addressEn: 'Main Market, Bajariya, Sawai Madhopur',
    pincode: '322001',
    timing: '09:00 AM - 08:00 PM',
    phone: '9875168011',
    isActive: true
  },
  {
    id: 'dc_bajariya_stationroad',
    saleCenterId: 'kendra_bajariya_sawaimadhopur',
    cityId: 'sawai_madhopur',
    nameHi: 'वितरण केंद्र — स्टेशन रोड',
    nameEn: 'Distribution Centre — Station Road',
    addressHi: 'स्टेशन रोड, बजरिया, सवाई माधोपुर',
    addressEn: 'Station Road, Bajariya, Sawai Madhopur',
    pincode: '322002',
    timing: '09:00 AM - 07:30 PM',
    phone: '9875168012',
    isActive: true
  },

  // --- Jaipur > Raja Park ---
  {
    id: 'dc_rajapark_lane4',
    saleCenterId: 'kendra_rajapark_jaipur',
    cityId: 'jaipur',
    nameHi: 'वितरण केंद्र — गली नं. 4',
    nameEn: 'Distribution Centre — Lane No. 4',
    addressHi: 'गली नं. 4, राजापार्क, जयपुर',
    addressEn: 'Lane No. 4, Raja Park, Jaipur',
    pincode: '302004',
    timing: '09:00 AM - 08:00 PM',
    phone: '9829054321',
    isActive: true
  },
  {
    id: 'dc_rajapark_tilaknagar',
    saleCenterId: 'kendra_rajapark_jaipur',
    cityId: 'jaipur',
    nameHi: 'वितरण केंद्र — तिलक नगर',
    nameEn: 'Distribution Centre — Tilak Nagar',
    addressHi: 'तिलक नगर, राजापार्क, जयपुर',
    addressEn: 'Tilak Nagar, Raja Park, Jaipur',
    pincode: '302005',
    timing: '09:30 AM - 08:00 PM',
    phone: '9829054322',
    isActive: true
  },

  // --- Kota > Gumanpura ---
  {
    id: 'dc_gumanpura_mainmarket',
    saleCenterId: 'kendra_gumanpura_kota',
    cityId: 'kota',
    nameHi: 'वितरण केंद्र — मुख्य बाज़ार',
    nameEn: 'Distribution Centre — Main Market',
    addressHi: 'मुख्य बाज़ार, गुमानपुरा, कोटा',
    addressEn: 'Main Market, Gumanpura, Kota',
    pincode: '324007',
    timing: '09:00 AM - 08:30 PM',
    phone: '9414123456',
    isActive: true
  },
  {
    id: 'dc_gumanpura_dadabari',
    saleCenterId: 'kendra_gumanpura_kota',
    cityId: 'kota',
    nameHi: 'वितरण केंद्र — दादाबाड़ी',
    nameEn: 'Distribution Centre — Dadabari',
    addressHi: 'दादाबाड़ी मुख्य मार्ग, कोटा',
    addressEn: 'Dadabari Main Road, Kota',
    pincode: '324009',
    timing: '09:30 AM - 08:00 PM',
    phone: '9414123457',
    isActive: true
  },

  // --- Jodhpur > Shastri Nagar ---
  {
    id: 'dc_shastri_circle',
    saleCenterId: 'kendra_shastri_jodhpur',
    cityId: 'jodhpur',
    nameHi: 'वितरण केंद्र — शास्त्री सर्कल',
    nameEn: 'Distribution Centre — Shastri Circle',
    addressHi: 'शास्त्री सर्कल, शास्त्री नगर, जोधपुर',
    addressEn: 'Shastri Circle, Shastri Nagar, Jodhpur',
    pincode: '342003',
    timing: '09:30 AM - 08:30 PM',
    phone: '9414234567',
    isActive: true
  },
  {
    id: 'dc_shastri_ratanada',
    saleCenterId: 'kendra_shastri_jodhpur',
    cityId: 'jodhpur',
    nameHi: 'वितरण केंद्र — रातानाडा',
    nameEn: 'Distribution Centre — Ratanada',
    addressHi: 'रातानाडा रोड, जोधपुर',
    addressEn: 'Ratanada Road, Jodhpur',
    pincode: '342011',
    timing: '09:00 AM - 08:00 PM',
    phone: '9414234568',
    isActive: true
  },

  // --- Alwar > Company Bagh ---
  {
    id: 'dc_companybagh_road',
    saleCenterId: 'kendra_companybagh_alwar',
    cityId: 'alwar',
    nameHi: 'वितरण केंद्र — कंपनी बाग रोड',
    nameEn: 'Distribution Centre — Company Bagh Road',
    addressHi: 'कंपनी बाग रोड, अलवर',
    addressEn: 'Company Bagh Road, Alwar',
    pincode: '301001',
    timing: '09:00 AM - 08:00 PM',
    phone: '9414345678',
    isActive: true
  },
  {
    id: 'dc_companybagh_hopecircus',
    saleCenterId: 'kendra_companybagh_alwar',
    cityId: 'alwar',
    nameHi: 'वितरण केंद्र — होप सर्कस',
    nameEn: 'Distribution Centre — Hope Circus',
    addressHi: 'होप सर्कस, अलवर',
    addressEn: 'Hope Circus, Alwar',
    pincode: '301002',
    timing: '09:30 AM - 08:00 PM',
    phone: '9414345679',
    isActive: true
  },

  // --- Bikaner > Kote Gate ---
  {
    id: 'dc_kotegate_mainroad',
    saleCenterId: 'kendra_kotegate_bikaner',
    cityId: 'bikaner',
    nameHi: 'वितरण केंद्र — कोटगेट मुख्य मार्ग',
    nameEn: 'Distribution Centre — Kote Gate Main Road',
    addressHi: 'कोटगेट मुख्य मार्ग, बीकानेर',
    addressEn: 'Kote Gate Main Road, Bikaner',
    pincode: '334001',
    timing: '09:00 AM - 08:30 PM',
    phone: '9414456789',
    isActive: true
  },
  {
    id: 'dc_kotegate_rani_bazar',
    saleCenterId: 'kendra_kotegate_bikaner',
    cityId: 'bikaner',
    nameHi: 'वितरण केंद्र — रानी बाज़ार',
    nameEn: 'Distribution Centre — Rani Bazar',
    addressHi: 'रानी बाज़ार, बीकानेर',
    addressEn: 'Rani Bazar, Bikaner',
    pincode: '334004',
    timing: '09:30 AM - 08:00 PM',
    phone: '9414456790',
    isActive: true
  }
];

export const INITIAL_MITRAS: MitraApplication[] = [
  {
    id: 'SM-SWM-101',
    cityId: 'sawai_madhopur',
    centerId: 'kendra_aastha_sawaimadhopur',
    cityNameHi: 'सवाई माधोपुर',
    fullName: 'राजेश गुप्ता',
    phone: '9413753383',
    email: 'rajesh.swm@gmail.com',
    pincode: '322001',
    address: 'बजरिया टोंक रोड़, सवाई माधोपुर',
    agreedToCenter: true,
    status: 'approved',
    createdAt: '2026-08-01 10:00',
    tempPassword: 'Pass#101',
    creditLimit: 25000
  },
  {
    id: 'SM-SWM-102',
    cityId: 'sawai_madhopur',
    cityNameHi: 'सवाई माधोपुर',
    fullName: 'दिनेश शर्मा',
    phone: '9875186011',
    email: 'dinesh.swm@gmail.com',
    pincode: '322001',
    address: 'टोंक रोड, सवाई माधोपुर',
    agreedToCenter: false,
    status: 'approved',
    createdAt: '2026-08-02 11:30',
    creditLimit: 25000
  },
  {
    id: 'SM-JPR-101',
    cityId: 'jaipur',
    cityNameHi: 'जयपुर',
    fullName: 'सुरेश शर्मा',
    phone: '9829012345',
    email: 'suresh.jpr@gmail.com',
    pincode: '302017',
    address: 'मालवीय नगर, जयपुर',
    agreedToCenter: true,
    status: 'approved',
    createdAt: '2026-08-03 10:00',
    tempPassword: 'Pass#102',
    creditLimit: 30000
  },
  {
    id: 'SM-KOT-101',
    cityId: 'kota',
    cityNameHi: 'कोटा',
    fullName: 'राकेश वर्मा',
    phone: '9414123456',
    email: 'rakesh.kota@gmail.com',
    pincode: '324007',
    address: 'गुमानपुरा, कोटा',
    agreedToCenter: true,
    status: 'approved',
    createdAt: '2026-08-03 12:00',
    tempPassword: 'Pass#103',
    creditLimit: 25000
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: '#PB-7011',
    festivalId: 'diwali_2026',
    festivalNameHi: 'दीपावली 2026',
    festivalNameEn: 'Diwali 2026',
    cityId: 'sawai_madhopur',
    cityNameHi: 'सवाई माधोपुर',
    centerId: 'dc_aastha_bajariya',
    saleCenterId: 'kendra_aastha_sawaimadhopur',
    centerNameHi: 'आस्था उपभोक्ता भण्डार',
    centerAddressHi: 'बजरिया टोंक रोड़, बजरिया स. माधोपुर',
    centerPhone: '9413753383',
    bookedByRole: 'customer',
    customer: {
      name: 'संजय मीना',
      phone: '9462919288',
      email: 'sanjay.swm@gmail.com',
      pincode: '322001',
      address: 'बजरिया, सवाई माधोपुर'
    },
    items: [
      {
        sweetId: 'kaju_katli_no_vark',
        sweetNameHi: 'काजू कतली (बिना वर्क)',
        sweetNameEn: 'Kaju Katli (Without Vark)',
        variantLabel: '1 kg (एक किलो)',
        variantKg: 1,
        pricePerKg: 700,
        quantity: 1,
        unitPrice: 700,
        totalAmount: 700,
        imageUrl: 'https://th.bing.com/th/id/OIP.p95T_AH9o_AbCgDM1Ie4ZAHaE8?w=275&h=184&c=7&r=0&o=7&pid=1.7&rm=3'
      },
      {
        sweetId: 'moong_barfi',
        sweetNameHi: 'मूंग बर्फी',
        sweetNameEn: 'Moong Burfi',
        variantLabel: '500g (आधा किलो)',
        variantKg: 0.5,
        pricePerKg: 460,
        quantity: 1,
        unitPrice: 240,
        totalAmount: 240,
        imageUrl: 'https://anandams.com/wp-content/uploads/2024/01/Moong-Dal-Burfi-scaled.jpg'
      },
      {
        sweetId: 'mathri',
        sweetNameHi: 'मठरी',
        sweetNameEn: 'Mathri',
        variantLabel: '500g (आधा किलो)',
        variantKg: 0.5,
        pricePerKg: 280,
        quantity: 1,
        unitPrice: 140,
        totalAmount: 140,
        imageUrl: 'https://resize.indiatv.in/resize/newbucket/1200_675/2026/02/mt-1771412570.webp'
      }
    ],
    totalKg: 2.0,
    totalAmount: 1080,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    status: 'delivered',
    deliveredAt: '2026-08-11 16:30',
    pickupDate: '2026-08-25',
    deliveryOtp: '7011',
    createdAt: '2026-08-10 10:15'
  },
  {
    id: '#PB-7012',
    festivalId: 'diwali_2026',
    festivalNameHi: 'दीपावली 2026',
    festivalNameEn: 'Diwali 2026',
    cityId: 'sawai_madhopur',
    cityNameHi: 'सवाई माधोपुर',
    centerId: 'dc_aastha_bajariya',
    saleCenterId: 'kendra_aastha_sawaimadhopur',
    centerNameHi: 'आस्था उपभोक्ता भण्डार',
    centerAddressHi: 'बजरिया टोंक रोड़, बजरिया स. माधोपुर',
    centerPhone: '9413753383',
    bookedByRole: 'mitra',
    mitraId: 'SM-SWM-101',
    mitraName: 'राजेश गुप्ता',
    customer: {
      name: 'मुकेश गोयल',
      phone: '9414011223',
      pincode: '322001',
      address: 'खेरदा, सवाई माधोपुर'
    },
    items: [
      {
        sweetId: 'kaju_katli_no_vark',
        sweetNameHi: 'काजू कतली (बिना वर्क)',
        sweetNameEn: 'Kaju Katli (Without Vark)',
        variantLabel: '1 kg (एक किलो)',
        variantKg: 1,
        pricePerKg: 700,
        quantity: 3,
        unitPrice: 700,
        totalAmount: 2100,
        imageUrl: 'https://th.bing.com/th/id/OIP.p95T_AH9o_AbCgDM1Ie4ZAHaE8?w=275&h=184&c=7&r=0&o=7&pid=1.7&rm=3'
      },
      {
        sweetId: 'moong_barfi',
        sweetNameHi: 'मूंग बर्फी',
        sweetNameEn: 'Moong Burfi',
        variantLabel: '1 kg (एक किलो)',
        variantKg: 1,
        pricePerKg: 460,
        quantity: 2,
        unitPrice: 460,
        totalAmount: 920,
        imageUrl: 'https://anandams.com/wp-content/uploads/2024/01/Moong-Dal-Burfi-scaled.jpg'
      }
    ],
    totalKg: 5.0,
    totalAmount: 3020,
    paymentMethod: 'udhar',
    paymentStatus: 'udhar_outstanding',
    status: 'confirmed',
    pickupDate: '2026-08-25',
    deliveryOtp: '7012',
    createdAt: '2026-08-11 11:20'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    actor: 'केशव बचत एवं साख सहकारी समिति (प्रबंधक)',
    actionHi: 'दीपावली 2026 उत्सव हेतु आस्था उपभोक्ता भण्डार, टोंक रोड केंद्र अधिकृत किया गया',
    timestamp: '2026-08-01 09:30'
  },
  {
    id: 'log_2',
    actor: 'सुपर एडमिन',
    actionHi: 'काजू कतली, मूंग बर्फी एवं मठरी हेतु अग्रिम दर सूची 24 अगस्त तक लागू की गई',
    timestamp: '2026-08-01 10:00'
  }
];

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'otp_verify',
    eventHi: 'OTP सत्यापन',
    smsEnabled: true,
    emailEnabled: false,
    templateTextHi: 'आस्था उपभोक्ता भण्डार लॉगिन/सत्यापन हेतु आपका OTP {#var#} है। वैधता 10 मिनट। - केशव सहकारी समिति',
    dltApproved: true
  },
  {
    id: 'mitra_approval',
    eventHi: 'सहकार मित्र स्वीकृति',
    smsEnabled: true,
    emailEnabled: true,
    templateTextHi: 'बधाई हो! सहकार मित्र आवेदन स्वीकृत। आईडी: {#id#}, पास: {#pass#}। आस्था उपभोक्ता भण्डार, सवाई माधोपुर',
    dltApproved: true
  },
  {
    id: 'booking_confirm',
    eventHi: 'बुकिंग पुष्टि रसीद',
    smsEnabled: true,
    emailEnabled: true,
    templateTextHi: 'प्रिय {#name#}, दीपावली प्री-बुकिंग {#id#} दर्ज हुई। केंद्र: आस्था उपभोक्ता भण्डार, टोंक रोड, सवाई माधोपुर, डिलीवरी OTP: {#otp#}',
    dltApproved: true
  },
  {
    id: 'center_change',
    eventHi: 'संग्रह केंद्र परिवर्तन सूचना',
    smsEnabled: true,
    emailEnabled: true,
    templateTextHi: 'सूचना: आपकी बुकिंग {#id#} का संग्रह केंद्र: आस्था उपभोक्ता भण्डार, बजरिया टोंक रोड़, सवाई माधोपुर।',
    dltApproved: true
  }
];

export const INITIAL_DISCOUNTS: DiscountCoupon[] = [
  {
    id: 'coup_sahakar50',
    code: 'SAHAKAR50',
    titleHi: 'सहकार विशेष छूट',
    titleEn: 'Sahakar Special Discount',
    descriptionHi: '₹500 या अधिक की अग्रिम मिठाई बुकिंग पर ₹50 की सीधी छूट',
    cityId: 'all',
    centerId: 'all',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 500,
    startDate: '2026-08-01',
    expiryDate: '2026-11-15',
    usageLimit: 500,
    timesUsed: 42,
    isActive: true,
    createdAt: '2026-08-01 10:00'
  },
  {
    id: 'coup_festive10',
    code: 'FESTIVE10',
    titleHi: 'त्योहारी उत्सव 10% छूट',
    titleEn: 'Festive Season 10% Off',
    descriptionHi: '₹800 से अधिक के ऑर्डर पर 10% की छूट (अधिकतम ₹150 तक)',
    cityId: 'all',
    centerId: 'all',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 800,
    maxDiscountAmount: 150,
    startDate: '2026-08-01',
    expiryDate: '2026-11-15',
    usageLimit: 300,
    timesUsed: 28,
    isActive: true,
    createdAt: '2026-08-02 11:30'
  },
  {
    id: 'coup_jaipur100',
    code: 'JAIPUR100',
    titleHi: 'जयपुर सहकार केंद्र विशेष',
    titleEn: 'Jaipur Sahakar Kendra Offer',
    descriptionHi: 'जयपुर जिले के सभी केंद्रों पर ₹1000 से अधिक की खरीदारी पर ₹100 छूट',
    cityId: 'jaipur',
    centerId: 'all',
    discountType: 'flat',
    discountValue: 100,
    minOrderAmount: 1000,
    startDate: '2026-08-05',
    expiryDate: '2026-11-20',
    usageLimit: 200,
    timesUsed: 19,
    isActive: true,
    createdAt: '2026-08-05 09:15'
  }
];

