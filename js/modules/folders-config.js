// Folders Configuration for Decks Page Explorer
export const FOLDERS_CONFIG = [
    {
        id: 'generales',
        title: 'Mazos Generales',
        desc: 'Colección completa de todos los mazos disponibles.',
        parentId: null,
        color: 'blue',
        coverKeyword: 'study'
    },
    {
        id: 'viajes',
        title: 'Viajes y Alojamiento',
        desc: 'Vocabulario esencial para viajar y hospedarse.',
        parentId: null,
        color: 'yellow',
        coverKeyword: 'travel'
    },
    {
        id: 'viajes_aeropuerto',
        title: 'En el Aeropuerto',
        desc: 'Check-in, aduanas, seguridad y embarque.',
        parentId: 'viajes',
        color: 'blue',
        coverKeyword: 'airport'
    },
    {
        id: 'viajes_ciudad',
        title: 'Ciudad y Direcciones',
        desc: 'Cómo orientarse y moverse en la ciudad.',
        parentId: 'viajes',
        color: 'pink',
        coverKeyword: 'city'
    },
    {
        id: 'comida',
        title: 'Comida y Cocina',
        desc: 'Restaurantes, compras y técnicas culinarias.',
        parentId: null,
        color: 'pink',
        coverKeyword: 'food'
    },
    {
        id: 'comida_restaurante',
        title: 'Restaurante y Servicio',
        desc: 'Pedir comida, interactuar y pagar.',
        parentId: 'comida',
        color: 'yellow',
        coverKeyword: 'restaurant'
    },
    {
        id: 'comida_cocina',
        title: 'Cocinando y Supermercado',
        desc: 'Ingredientes y verbos de preparación.',
        parentId: 'comida',
        color: 'black',
        coverKeyword: 'cooking'
    },
    {
        id: 'vida_diaria',
        title: 'Vida Diaria y Ocio',
        desc: 'Rutinas, pasatiempos, salud y cotidianidad.',
        parentId: null,
        color: 'black',
        coverKeyword: 'lifestyle'
    },
    {
        id: 'vida_rutinas',
        title: 'Rutina Diaria',
        desc: 'Acciones desde la mañana hasta la noche.',
        parentId: 'vida_diaria',
        color: 'blue',
        coverKeyword: 'routine'
    },
    {
        id: 'vida_salud',
        title: 'Salud y el Médico',
        desc: 'Describir síntomas y entender indicaciones.',
        parentId: 'vida_diaria',
        color: 'pink',
        coverKeyword: 'health'
    },
    {
        id: 'personalizados',
        title: 'Mis Personalizados',
        desc: 'Tablas importadas desde CSV o archivos locales.',
        parentId: null,
        color: 'black',
        coverKeyword: 'files'
    }
];

/**
 * Returns the folder layout mappings of decks to their specific folder IDs.
 * A deck can belong to multiple folders (e.g. airport in general and viajes_aeropuerto).
 */
export const DECK_FOLDER_MAPPINGS = {
    // Viajes
    'aeropuerto': ['viajes', 'viajes_aeropuerto'],
    'direcciones': ['viajes', 'viajes_ciudad'],
    'alojamiento': ['viajes'],
    
    // Comida
    'restaurante': ['comida', 'comida_restaurante'],
    'cocinando': ['comida', 'comida_cocina'],
    'supermercado': ['comida', 'comida_cocina'],
    
    // Vida Diaria
    'rutina_manana': ['vida_diaria', 'vida_rutinas'],
    'tarde_noche': ['vida_diaria', 'vida_rutinas'],
    'compras': ['vida_diaria'],
    'ocio': ['vida_diaria'],
    'salud': ['vida_diaria', 'vida_salud']
};
