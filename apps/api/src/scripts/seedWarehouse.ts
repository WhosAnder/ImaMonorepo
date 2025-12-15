import { getWarehouseStockCollection, getClient } from "../db/mongo";
import { WarehouseStockItem } from "../modules/warehouse/warehouse.types";

const itemsToSeed = [
  {
    equipo: "ESPÁTULAS DE ACERO INOXIDABLE DE 200-250 MM",
    cantidad: 3,
  },
  {
    equipo: "PULIDORAS INALÁMBRICA DE 600 A 3500 RPM.",
    cantidad: 3,
  },
  {
    equipo: "JUEGOS DE ESLINGA DE DIFERENTES CAPACIDADES",
    cantidad: 3,
  },
  {
    equipo: "TALADROS PORTÁTILES DE NIVEL AJUSTABLE",
    cantidad: 3,
  },
  {
    equipo: "JUEGO DE DESARMADORES CLEMERO DE DIFERENTES MEDIDAS.",
    cantidad: 6,
  },
  {
    equipo: "JUEGO DE LLAVES ALLEN DE DIFERENTES MEDIDAS.",
    cantidad: 6,
  },
  {
    equipo: "JUEGO DE LLAVES MIXTAS DE DIFERENTES MEDIDAS.",
    cantidad: 6,
  },
  {
    equipo: "JUEGO DE LLAVES TORX DE DIFERENTES MEDIDAS.",
    cantidad: 6,
  },
  {
    equipo: "PINZAS DE CORTE.",
    cantidad: 6,
  },
  {
    equipo: "PINZAS DE ELECTRICISTA.",
    cantidad: 6,
  },
  {
    equipo: "PINZAS MECÁNICAS.",
    cantidad: 6,
  },
  {
    equipo: "PINZAS DE PUNTA.",
    cantidad: 6,
  },
  {
    equipo: "PONCHADORAS DE CABLE.",
    cantidad: 3,
  },
  {
    equipo: "JUEGO DE AUTOCLEAN PROFESIONAL ESTÁNDAR Y MILIMÉTRICO.",
    cantidad: 6,
  },
  {
    equipo: "EQUIPO DE TOPOGRAFÍA (ESTACIÓN TOTAL, NIVEL AUTOMÁTICO).",
    cantidad: 1,
  },
  {
    equipo: "BINOCULARES DE LARGO ALCANCE DE MIN AUMENTO DE 20X",
    cantidad: 2,
  },
  {
    equipo:
      "LÁMPARAS LED PORTÁTILES DE LUZ BLANCA DE LARGO ALCANCE DE MIN 850 LÚMENES",
    cantidad: 8,
  },
  {
    equipo: "BOMBA HIDRÁULICA Y PISTÓN 5850 KGF (20 TONELADAS)",
    cantidad: 1,
  },
  {
    equipo: "BOMBA HIDRÁULICA Y PISTÓN 10 000 PSI (10 T)",
    cantidad: 1,
  },
  {
    equipo:
      "ANALIZADOR DE ENERGÍA CLASIFICACIÓN DE CAT IV A 600V Y CAT III A 1,000V. TENDENCIA AUTOMÁTICA, FUNCIÓN DE REGISTRADOR, MEMORIA DE HASTA 600 PARÁMETROS VELOCIDAD DE MUESTREO: 200 KS/S",
    cantidad: 1,
  },
  {
    equipo:
      "CÁMARA TERMOGRÁFICA TEMPERATURA MÍN.: -20°C, TEMPERATURA MÁX.: 650°C, RESOLUCIÓN IR: 160 X 120, SENSIBILIDAD TÉRMICA (NETD): 0.07°C, CAMPO DE VISIÓN (H X V): 25° X 19°, DISTANCIA FOCAL IR MÍN.: 400MM, FRECUENCIA DE CAPTURA DE IMÁGENES: 60HZ",
    cantidad: 1,
  },
  {
    equipo: "CALIBRADOR DIGITAL 0 MM A 150 MM",
    cantidad: 2,
  },
  {
    equipo: "OSCILOSCOPIO DE DOBLE CANAL (DIGITAL) 300 V AC A 100 MHZ",
    cantidad: 1,
  },
  {
    equipo: "MANÓMETRO DE BOURDON (0-140 PSI) 0 A 10 BAR",
    cantidad: 2,
  },
  {
    equipo: "MANÓMETRO 0 A 400 PSI",
    cantidad: 2,
  },
  {
    equipo: "MEDIDOR DE VIBRACIONES",
    cantidad: 2,
  },
  {
    equipo: "ESTETOSCOPIO ELECTRÓNICO RANGO DE FRECUENCIA: 30 HZ - 15 KHZ,",
    cantidad: 4,
  },
  {
    equipo:
      "PIRÓMETRO DE RADIACIÓN TIPO INFRARROJO -40 °C A 550 ° C (DE -40 °F A 1022 °F)",
    cantidad: 2,
  },
  {
    equipo: "MEDIDORES DE TEMPERATURA -200 A 1370° C",
    cantidad: 2,
  },
  {
    equipo: "CALIBRADOR VERNIER 0 MM A 200 MM",
    cantidad: 2,
  },
  {
    equipo: 'REGLA PATRÓN SEMIFLEX 40"/1000MM',
    cantidad: 2,
  },
  {
    equipo: "ASPIRADORAS DE MIN 5 H.P.",
    cantidad: 3,
  },
  {
    equipo: "COMPRESORES DE MIN 2.5 HP.",
    cantidad: 3,
  },
  {
    equipo: "DIFERENCIALES O POLIPASTO PARA MIN T TONELADAS",
    cantidad: 3,
  },
  {
    equipo: "ESMERILES ANGULARES DE MIN 6,600 RPM",
    cantidad: 3,
  },
  {
    equipo: "IMPRESORA ETIQUETADORA PARA IDENTIFICAR CABLES.",
    cantidad: 3,
  },
  {
    equipo: "PLANTAS DE SOLDAR DE CD.",
    cantidad: 3,
  },
  {
    equipo: "TORQUÍMETRO 1000 LB-FT (1355.82 NM)",
    cantidad: 2,
  },
  {
    equipo: "TORQUÍMETRO 600 LB-FT (813.49 NM)",
    cantidad: 2,
  },
  {
    equipo: "TORQUÍMETRO 300 A 1500 NM",
    cantidad: 2,
  },
  {
    equipo: "TORQUÍMETRO 100 A 600 LB-FT",
    cantidad: 2,
  },
  {
    equipo: "MULTIPLICADOR DE TORQUE 3200 LB-FT",
    cantidad: 2,
  },
  {
    equipo: "MICRÓMETRO DE PROFUNDIDAD DIGITAL 0 MM A 152.4 MM (0 PLG A 6 PLG)",
    cantidad: 2,
  },
  {
    equipo: "AMPERÍMETROS DIGITALES MARCA FLUKE 373 O DE MEJOR CALIDAD",
    cantidad: 4,
  },
  {
    equipo: "MULTÍMETROS DIGITALES MARCA FLUKE 87V O DE MEJOR CALIDAD",
    cantidad: 2,
  },
  {
    equipo: "MEGÓHMETRO MULTIFUNCIÓN",
    cantidad: 1,
  },
  {
    equipo: "MANÓMETRO Y BOMBA 10000 PSI, BOMBA (20 T A 10 000 PSI)",
    cantidad: 3,
  },
  {
    equipo:
      "NIVEL ELECTRÓNICO (COMPENSADOR CON AMORTIGUACIÓN MAGNÉTICA) (PRECISIÓN: DESVIACIÓN ESTÁNDAR PARA 1 KM EN NIVELACIÓN DOBLE (ISO 17123-2) (MEDICIONES ELECTRÓNICAS: CON MIRAS DE INVAR: 0.9MM CON MIRAS ESTÁNDAR: 1.5MM - MEDICIONES ÓPTICAS: 2.0MM)",
    cantidad: 1,
  },
  {
    equipo: 'MICRÓMETRO DE INTERIORES 0.200 A 1.200"',
    cantidad: 2,
  },
  {
    equipo: "TACÓMETROS DIGITALES",
    cantidad: 3,
  },
  {
    equipo: "MEDIDORES LASER (PARA NIVELACIÓN)",
    cantidad: 3,
  },
];

function generateSku(name: string, index: number): string {
  // Simple SKU: First 3 letters of name + index + random 3 chars
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "X");
  const cleanIndex = index.toString().padStart(3, "0");
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${cleanIndex}-${suffix}`;
}

async function seed() {
  console.log("Starting warehouse seed...");
  let client;
  try {
    const collection = await getWarehouseStockCollection();
    client = await getClient();

    for (let i = 0; i < itemsToSeed.length; i++) {
      const item = itemsToSeed[i];

      // Check if exists by name to avoid duplicates
      const existing = await collection.findOne({ name: item.equipo });
      if (existing) {
        console.log(`Skipping existing item: ${item.equipo}`);
        continue;
      }

      const sku = generateSku(item.equipo, i);
      const newItem: WarehouseStockItem = {
        sku,
        name: item.equipo,
        quantityOnHand: item.cantidad,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Optional fields left undefined
      };

      await collection.insertOne(newItem);
      console.log(`Inserted: ${item.equipo}`);
    }

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding warehouse:", error);
  } finally {
    if (client) {
      await client.close();
    }
    process.exit(0);
  }
}

seed();
