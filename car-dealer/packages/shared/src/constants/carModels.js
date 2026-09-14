/**
 * Belarusian market car list (av.by representative models, 2025).
 * Used by listingGenerator to pick makes/models for market listings.
 *
 * Each entry: { make, model, yearRange: [min, max], priceRange: [min, max] }
 * Prices in BYN, calibrated to GMS Section 4 price bands.
 */
export const CAR_MODELS = [
  // ============================================================
  // Budget beaters (800 – 3,500 BYN) — early game
  // ============================================================

  { make: 'ВАЗ',      model: '2105',        yearRange: [1985, 2004], priceRange: [800,  1800] },
  { make: 'ВАЗ',      model: '2106',        yearRange: [1985, 2005], priceRange: [900,  2000] },
  { make: 'ВАЗ',      model: '2107',        yearRange: [1990, 2005], priceRange: [1000, 2200] },
  { make: 'ВАЗ',      model: '2109',        yearRange: [1990, 2004], priceRange: [1200, 2500] },
  { make: 'ВАЗ',      model: '2110',        yearRange: [1996, 2007], priceRange: [1200, 2500] },
  { make: 'ВАЗ',      model: '2111',        yearRange: [1997, 2009], priceRange: [1300, 2600] },
  { make: 'ВАЗ',      model: '2112',        yearRange: [1999, 2008], priceRange: [1300, 2700] },
  { make: 'ВАЗ',      model: '2113',        yearRange: [2004, 2013], priceRange: [1400, 2800] },
  { make: 'ВАЗ',      model: '2114',        yearRange: [2001, 2013], priceRange: [1500, 3000] },
  { make: 'ВАЗ',      model: '2115',        yearRange: [1997, 2012], priceRange: [1400, 2800] },

  { make: 'Москвич',  model: '2141',        yearRange: [1988, 2001], priceRange: [800,  1800] },
  { make: 'ЗАЗ',      model: 'Славута',      yearRange: [1999, 2011], priceRange: [800,  1800] },
  { make: 'ZAZ',      model: 'Sens',         yearRange: [2002, 2014], priceRange: [1000, 2200] },
  { make: 'Daewoo',   model: 'Nexia',        yearRange: [1995, 2008], priceRange: [1300, 2800] },
  { make: 'Daewoo',   model: 'Matiz',        yearRange: [1998, 2010], priceRange: [1200, 2500] },
  { make: 'Daewoo',   model: 'Lanos',        yearRange: [1997, 2010], priceRange: [1400, 3000] },

  { make: 'Renault',  model: 'Clio II',      yearRange: [1998, 2007], priceRange: [1800, 3500] },
  { make: 'Renault',  model: 'Symbol',       yearRange: [2000, 2008], priceRange: [1800, 3500] },
  { make: 'Peugeot',  model: '206',           yearRange: [1998, 2010], priceRange: [2500, 6000] },
  { make: 'Fiat',     model: 'Punto II',      yearRange: [1999, 2005], priceRange: [1600, 3200] },
  { make: 'Opel',     model: 'Corsa B',       yearRange: [1993, 2000], priceRange: [1400, 3000] },
  { make: 'Ford',     model: 'Fiesta V',      yearRange: [2002, 2008], priceRange: [2200, 4000] },

  // ============================================================
  // Lower-mid (3,000 – 7,000 BYN)
  // ============================================================

  { make: 'Volkswagen', model: 'Golf III',       yearRange: [1991, 1998], priceRange: [2500, 5000] },
  { make: 'Volkswagen', model: 'Passat B4',      yearRange: [1993, 1997], priceRange: [2500, 5000] },
  { make: 'Volkswagen', model: 'Polo III',       yearRange: [1995, 2001], priceRange: [2500, 5000] },
  { make: 'Opel',        model: 'Astra F',       yearRange: [1991, 1998], priceRange: [2000, 4500] },
  { make: 'Opel',        model: 'Astra G',       yearRange: [1998, 2004], priceRange: [3000, 6500] },
  { make: 'Opel',        model: 'Vectra B',      yearRange: [1995, 2002], priceRange: [2800, 6000] },
  { make: 'Opel',        model: 'Zafira A',      yearRange: [1999, 2005], priceRange: [3500, 6500] },

  { make: 'Ford',        model: 'Focus I',       yearRange: [1998, 2004], priceRange: [2800, 5500] },
  { make: 'Ford',        model: 'Mondeo II',     yearRange: [1996, 2000], priceRange: [2500, 4500] },
  { make: 'Ford',        model: 'Mondeo III',    yearRange: [2000, 2007], priceRange: [3500, 7500] },
  { make: 'Ford',        model: 'Fusion',        yearRange: [2002, 2012], priceRange: [3500, 6500] },

  { make: 'Renault',     model: 'Megane II',     yearRange: [2002, 2008], priceRange: [3000, 6000] },
  { make: 'Renault',     model: 'Clio III',      yearRange: [2005, 2012], priceRange: [3500, 6500] },
  { make: 'Renault',     model: 'Logan',         yearRange: [2004, 2013], priceRange: [3000, 7000] },
  { make: 'Renault',     model: 'Scenic II',     yearRange: [2003, 2009], priceRange: [3500, 6500] },

  { make: 'Peugeot',     model: '307',            yearRange: [2001, 2008], priceRange: [3000, 6000] },
  { make: 'Peugeot',     model: '406',            yearRange: [1996, 2004], priceRange: [2500, 5000] },
  { make: 'Citroen',     model: 'C4 I',           yearRange: [2004, 2010], priceRange: [3500, 6500] },
  { make: 'Citroen',     model: 'Xsara Picasso',  yearRange: [1999, 2010], priceRange: [3000, 5500] },

  // ============================================================
  // Mid-range (3,500 – 12,000 BYN)
  // ============================================================

  { make: 'Volkswagen', model: 'Golf IV',         yearRange: [1997, 2006], priceRange: [3500, 7500] },
  { make: 'Volkswagen', model: 'Golf V',          yearRange: [2003, 2009], priceRange: [5000, 10000] },
  { make: 'Volkswagen', model: 'Passat B5',       yearRange: [1996, 2005], priceRange: [3500, 8000] },
  { make: 'Volkswagen', model: 'Passat B5.5',     yearRange: [2000, 2005], priceRange: [4500, 8500] },
  { make: 'Volkswagen', model: 'Polo IV',         yearRange: [2001, 2009], priceRange: [3500, 7000] },
  { make: 'Volkswagen', model: 'Touran I',        yearRange: [2003, 2010], priceRange: [5500, 10000] },

  { make: 'Skoda',       model: 'Fabia I',        yearRange: [1999, 2007], priceRange: [3000, 6000] },
  { make: 'Skoda',       model: 'Fabia II',       yearRange: [2007, 2014], priceRange: [5000, 9000] },
  { make: 'Skoda',       model: 'Octavia Tour',   yearRange: [1996, 2010], priceRange: [3500, 7500] },
  { make: 'Skoda',       model: 'Octavia A5',     yearRange: [2004, 2013], priceRange: [5000, 11000] },
  { make: 'Skoda',       model: 'Roomster',        yearRange: [2006, 2015], priceRange: [4500, 8500] },

  { make: 'Opel',        model: 'Astra H',        yearRange: [2004, 2014], priceRange: [4500, 9000] },
  { make: 'Opel',        model: 'Vectra C',       yearRange: [2002, 2008], priceRange: [4000, 8000] },
  { make: 'Opel',        model: 'Corsa D',         yearRange: [2006, 2014], priceRange: [4500, 8500] },
  { make: 'Opel',        model: 'Zafira B',        yearRange: [2005, 2014], priceRange: [5000, 9000] },

  { make: 'Ford',        model: 'Focus II',        yearRange: [2005, 2011], priceRange: [4500, 9000] },
  { make: 'Ford',        model: 'Focus III',       yearRange: [2011, 2015], priceRange: [7500, 12000] },
  { make: 'Ford',        model: 'Mondeo IV',       yearRange: [2007, 2014], priceRange: [6500, 12000] },
  { make: 'Ford',        model: 'C-Max I',         yearRange: [2003, 2010], priceRange: [4000, 7500] },

  { make: 'Renault',     model: 'Megane III',      yearRange: [2008, 2015], priceRange: [5500, 10000] },
  { make: 'Renault',     model: 'Laguna II',       yearRange: [2001, 2007], priceRange: [3000, 6500] },
  { make: 'Renault',     model: 'Laguna III',      yearRange: [2007, 2015], priceRange: [5000, 9000] },
  { make: 'Renault',     model: 'Duster I',        yearRange: [2010, 2015], priceRange: [8500, 14000] },

  { make: 'Peugeot',     model: '308 I',           yearRange: [2007, 2013], priceRange: [5000, 9000] },
  { make: 'Peugeot',     model: '407',             yearRange: [2004, 2010], priceRange: [4000, 8000] },
  { make: 'Peugeot',     model: '508 I',            yearRange: [2011, 2015], priceRange: [8000, 14000] },

  // ============================================================
  // Asian mid-range
  // ============================================================

  { make: 'Hyundai',     model: 'Accent',          yearRange: [2000, 2011], priceRange: [3500, 8000] },
  { make: 'Hyundai',     model: 'Getz',            yearRange: [2002, 2011], priceRange: [3000, 6500] },
  { make: 'Hyundai',     model: 'i30 I',            yearRange: [2007, 2012], priceRange: [5000, 9000] },
  { make: 'Hyundai',     model: 'Elantra HD',       yearRange: [2006, 2011], priceRange: [4500, 8500] },
  { make: 'Hyundai',     model: 'Sonata NF',        yearRange: [2005, 2010], priceRange: [5000, 9000] },

  { make: 'Kia',         model: 'Rio II',           yearRange: [2005, 2011], priceRange: [4000, 8500] },
  { make: 'Kia',         model: 'Rio III',          yearRange: [2011, 2015], priceRange: [7000, 11000] },
  { make: 'Kia',         model: 'Ceed I',           yearRange: [2007, 2012], priceRange: [5000, 9000] },
  { make: 'Kia',         model: 'Cerato I',         yearRange: [2004, 2009], priceRange: [4000, 7500] },
  { make: 'Kia',         model: 'Magentis II',      yearRange: [2005, 2010], priceRange: [4500, 8500] },

  { make: 'Toyota',      model: 'Corolla E12',      yearRange: [2001, 2006], priceRange: [5000, 10000] },
  { make: 'Toyota',      model: 'Avensis T25',      yearRange: [2003, 2008], priceRange: [5500, 10500] },
  { make: 'Toyota',      model: 'Yaris II',         yearRange: [2005, 2011], priceRange: [5000, 9000] },
  { make: 'Toyota',      model: 'Prius II',         yearRange: [2004, 2009], priceRange: [6000, 11000] },

  { make: 'Mitsubishi',  model: 'Lancer IX',        yearRange: [2003, 2009], priceRange: [5000, 11000] },
  { make: 'Mitsubishi',  model: 'Colt VI',          yearRange: [2004, 2012], priceRange: [4000, 8000] },
  { make: 'Mitsubishi',  model: 'Carisma',           yearRange: [1996, 2004], priceRange: [2500, 5000] },

  { make: 'Nissan',      model: 'Almera N16',       yearRange: [2000, 2006], priceRange: [3500, 8000] },
  { make: 'Nissan',      model: 'Primera P12',      yearRange: [2002, 2008], priceRange: [3500, 7000] },
  { make: 'Nissan',      model: 'Note I',           yearRange: [2006, 2012], priceRange: [4500, 8000] },
  { make: 'Nissan',      model: 'Qashqai J10',      yearRange: [2007, 2013], priceRange: [7000, 13000] },

  { make: 'Mazda',       model: '3 BK',             yearRange: [2003, 2009], priceRange: [4500, 9500] },
  { make: 'Mazda',       model: '3 BL',             yearRange: [2009, 2013], priceRange: [6500, 11000] },
  { make: 'Mazda',       model: '6 GG',             yearRange: [2002, 2008], priceRange: [4500, 9000] },
  { make: 'Mazda',       model: '6 GH',             yearRange: [2007, 2012], priceRange: [6500, 11000] },

  { make: 'Honda',       model: 'Civic VII',        yearRange: [2001, 2006], priceRange: [4000, 9000] },
  { make: 'Honda',       model: 'Civic VIII',       yearRange: [2006, 2011], priceRange: [6000, 11000] },
  { make: 'Honda',       model: 'Accord VII',       yearRange: [2003, 2008], priceRange: [6000, 11000] },

  // ============================================================
  // Upper mid (10,000 – 28,000 BYN)
  // ============================================================

  { make: 'Volkswagen',  model: 'Passat B6',        yearRange: [2005, 2011], priceRange: [7000, 16000] },
  { make: 'Volkswagen',  model: 'Passat B7',        yearRange: [2010, 2014], priceRange: [11000, 20000] },
  { make: 'Volkswagen',  model: 'Tiguan I',         yearRange: [2007, 2015], priceRange: [10000, 18000] },
  { make: 'Volkswagen',  model: 'Sharan II',        yearRange: [2010, 2015], priceRange: [13000, 22000] },

  { make: 'Toyota',      model: 'Camry V40',        yearRange: [2006, 2011], priceRange: [10000, 22000] },
  { make: 'Toyota',      model: 'Camry V50',        yearRange: [2011, 2015], priceRange: [16000, 28000] },
  { make: 'Toyota',      model: 'RAV4 III',         yearRange: [2005, 2012], priceRange: [9000, 20000] },
  { make: 'Toyota',      model: 'RAV4 IV',          yearRange: [2013, 2016], priceRange: [18000, 28000] },
  { make: 'Toyota',      model: 'Avensis T27',      yearRange: [2009, 2015], priceRange: [10000, 18000] },

  { make: 'Skoda',       model: 'Superb II',        yearRange: [2008, 2015], priceRange: [8000, 18000] },
  { make: 'Skoda',       model: 'Octavia A7',       yearRange: [2013, 2016], priceRange: [12000, 20000] },
  { make: 'Skoda',       model: 'Yeti',             yearRange: [2009, 2015], priceRange: [9000, 16000] },

  { make: 'Kia',         model: 'Sportage II',      yearRange: [2004, 2010], priceRange: [6000, 13000] },
  { make: 'Kia',         model: 'Sportage III',     yearRange: [2010, 2015], priceRange: [10000, 19000] },
  { make: 'Kia',         model: 'Sorento II',       yearRange: [2009, 2015], priceRange: [12000, 22000] },
  { make: 'Kia',         model: 'Optima III',        yearRange: [2011, 2015], priceRange: [11000, 19000] },

  { make: 'Hyundai',     model: 'ix35',             yearRange: [2010, 2015], priceRange: [9000, 17000] },
  { make: 'Hyundai',     model: 'Tucson I',         yearRange: [2004, 2010], priceRange: [6000, 12000] },
  { make: 'Hyundai',     model: 'Santa Fe II',      yearRange: [2006, 2012], priceRange: [9000, 17000] },
  { make: 'Hyundai',     model: 'Sonata YF',        yearRange: [2010, 2014], priceRange: [9000, 16000] },

  { make: 'Ford',        model: 'Kuga I',           yearRange: [2008, 2015], priceRange: [9000, 17000] },
  { make: 'Ford',        model: 'Mondeo IV',        yearRange: [2007, 2014], priceRange: [6500, 12000] },
  { make: 'Ford',        model: 'S-Max I',          yearRange: [2006, 2014], priceRange: [8000, 15000] },

  { make: 'Subaru',      model: 'Forester II',      yearRange: [2002, 2008], priceRange: [6000, 14000] },
  { make: 'Subaru',      model: 'Forester III',     yearRange: [2008, 2013], priceRange: [9000, 17000] },
  { make: 'Subaru',      model: 'Outback III',      yearRange: [2003, 2009], priceRange: [7000, 14000] },

  { make: 'Nissan',      model: 'X-Trail T30',      yearRange: [2001, 2007], priceRange: [6000, 12000] },
  { make: 'Nissan',      model: 'X-Trail T31',      yearRange: [2007, 2014], priceRange: [9000, 17000] },
  { make: 'Nissan',      model: 'Murano I',         yearRange: [2003, 2008], priceRange: [7000, 13000] },

  // ============================================================
  // Premium (14,000 – 50,000 BYN)
  // ============================================================

  { make: 'BMW',         model: '3 E46',            yearRange: [1998, 2006], priceRange: [7000, 18000] },
  { make: 'BMW',         model: '3 E90',            yearRange: [2005, 2012], priceRange: [10000, 24000] },
  { make: 'BMW',         model: '3 F30',            yearRange: [2012, 2016], priceRange: [22000, 38000] },
  { make: 'BMW',         model: '5 E39',            yearRange: [1995, 2003], priceRange: [6000, 16000] },
  { make: 'BMW',         model: '5 E60',            yearRange: [2003, 2010], priceRange: [14000, 32000] },
  { make: 'BMW',         model: '5 F10',            yearRange: [2010, 2016], priceRange: [24000, 45000] },
  { make: 'BMW',         model: 'X3 E83',            yearRange: [2003, 2010], priceRange: [10000, 22000] },
  { make: 'BMW',         model: 'X5 E53',            yearRange: [1999, 2006], priceRange: [10000, 24000] },

  { make: 'Audi',        model: 'A4 B6',             yearRange: [2000, 2005], priceRange: [6000, 15000] },
  { make: 'Audi',        model: 'A4 B7',             yearRange: [2004, 2008], priceRange: [8000, 20000] },
  { make: 'Audi',        model: 'A4 B8',             yearRange: [2008, 2015], priceRange: [14000, 30000] },
  { make: 'Audi',        model: 'A6 C5',             yearRange: [1997, 2004], priceRange: [6000, 15000] },
  { make: 'Audi',        model: 'A6 C6',             yearRange: [2004, 2011], priceRange: [11000, 28000] },
  { make: 'Audi',        model: 'Q7',                yearRange: [2006, 2014], priceRange: [18000, 40000] },

  { make: 'Mercedes',    model: 'C-Class W203',      yearRange: [2000, 2007], priceRange: [7000, 18000] },
  { make: 'Mercedes',    model: 'C-Class W204',      yearRange: [2007, 2014], priceRange: [15000, 32000] },
  { make: 'Mercedes',    model: 'E-Class W210',      yearRange: [1995, 2002], priceRange: [5000, 14000] },
  { make: 'Mercedes',    model: 'E-Class W211',      yearRange: [2002, 2009], priceRange: [10000, 26000] },
  { make: 'Mercedes',    model: 'E-Class W212',      yearRange: [2009, 2015], priceRange: [22000, 42000] },
  { make: 'Mercedes',    model: 'ML W163',           yearRange: [1998, 2005], priceRange: [8000, 18000] },

  { make: 'Lexus',       model: 'IS 250',             yearRange: [2005, 2012], priceRange: [14000, 28000] },
  { make: 'Lexus',       model: 'GS 300',             yearRange: [2005, 2011], priceRange: [14000, 28000] },
  { make: 'Lexus',       model: 'RX 330',             yearRange: [2003, 2009], priceRange: [12000, 28000] },
  { make: 'Lexus',       model: 'RX 350',             yearRange: [2008, 2015], priceRange: [18000, 35000] },

  // ============================================================
  // Premium / performance / enthusiast
  // ============================================================

  { make: 'BMW',         model: 'Z4 E85',             yearRange: [2003, 2008], priceRange: [16000, 30000] },
  { make: 'BMW',         model: '6 E63',              yearRange: [2003, 2010], priceRange: [18000, 40000] },
  { make: 'Audi',        model: 'TT 8J',              yearRange: [2006, 2014], priceRange: [15000, 30000] },
  { make: 'Mercedes',    model: 'SLK R171',           yearRange: [2004, 2011], priceRange: [16000, 30000] },
  { make: 'Volvo',       model: 'S60 I',              yearRange: [2000, 2009], priceRange: [6000, 16000] },
  { make: 'Volvo',       model: 'S80 II',             yearRange: [2006, 2012], priceRange: [10000, 22000] },
  { make: 'Volvo',       model: 'XC90 I',             yearRange: [2002, 2014], priceRange: [10000, 25000] },

  // ============================================================
  // MPV / family / commercial-ish
  // ============================================================

  { make: 'Volkswagen',  model: 'Caddy III',          yearRange: [2004, 2015], priceRange: [6500, 14000] },
  { make: 'Volkswagen',  model: 'Transporter T5',     yearRange: [2003, 2015], priceRange: [10000, 25000] },
  { make: 'Renault',     model: 'Kangoo II',           yearRange: [2008, 2015], priceRange: [6500, 13000] },
  { make: 'Citroen',     model: 'Berlingo II',         yearRange: [2008, 2015], priceRange: [6000, 12000] },
  { make: 'Peugeot',     model: 'Partner II',          yearRange: [2008, 2015], priceRange: [6000, 12000] },
  { make: 'Ford',        model: 'Transit',             yearRange: [2000, 2014], priceRange: [6000, 18000] },
  { make: 'Opel',        model: 'Vivaro A',            yearRange: [2001, 2014], priceRange: [6000, 15000] },

  // ============================================================
  // Miscellaneous / market variety
  // ============================================================

  { make: 'Chevrolet',   model: 'Lacetti',             yearRange: [2004, 2013], priceRange: [3000, 6500] },
  { make: 'Chevrolet',   model: 'Aveo',                yearRange: [2003, 2011], priceRange: [2500, 5500] },
  { make: 'Chevrolet',   model: 'Cruze',               yearRange: [2009, 2015], priceRange: [5500, 10000] },
  { make: 'Daewoo',      model: 'Lacetti',             yearRange: [2002, 2010], priceRange: [2500, 5500] },
  { make: 'Suzuki',      model: 'Swift III',            yearRange: [2005, 2010], priceRange: [4000, 7500] },
  { make: 'Suzuki',      model: 'SX4',                 yearRange: [2006, 2013], priceRange: [5500, 10000] },
  { make: 'Suzuki',      model: 'Grand Vitara II',     yearRange: [2005, 2014], priceRange: [8000, 15000] },
  { make: 'Mitsubishi',  model: 'Pajero III',           yearRange: [1999, 2006], priceRange: [9000, 20000] },
  { make: 'Mitsubishi',  model: 'Outlander II',         yearRange: [2006, 2012], priceRange: [7000, 15000] },
  { make: 'Honda',       model: 'CR-V II',              yearRange: [2002, 2006], priceRange: [6500, 13000] },
  { make: 'Honda',       model: 'CR-V III',             yearRange: [2007, 2012], priceRange: [10000, 20000] },
  { make: 'Nissan',      model: 'Tiida',                yearRange: [2004, 2011], priceRange: [4000, 8000] },
  { make: 'Nissan',      model: 'Juke',                 yearRange: [2010, 2015], priceRange: [8000, 15000] },
];