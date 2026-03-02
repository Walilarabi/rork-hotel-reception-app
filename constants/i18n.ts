export type LanguageId = 'fr' | 'en' | 'de' | 'es' | 'it' | 'pt' | 'ar';

export interface LanguageOption {
  id: LanguageId;
  label: string;
  flag: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'fr', label: 'Français', flag: '🇫🇷', nativeLabel: 'Français' },
  { id: 'en', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
  { id: 'de', label: 'Allemand', flag: '🇩🇪', nativeLabel: 'Deutsch' },
  { id: 'es', label: 'Espagnol', flag: '🇪🇸', nativeLabel: 'Español' },
  { id: 'it', label: 'Italien', flag: '🇮🇹', nativeLabel: 'Italiano' },
  { id: 'pt', label: 'Portugais', flag: '🇵🇹', nativeLabel: 'Português' },
  { id: 'ar', label: 'Arabe', flag: '🇸🇦', nativeLabel: 'العربية' },
];

type TranslationKeys = {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    back: string;
    confirm: string;
    loading: string;
    error: string;
    success: string;
    noData: string;
    all: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
    export: string;
    import: string;
    close: string;
    retry: string;
    yes: string;
    no: string;
  };
  auth: {
    login: string;
    logout: string;
    logoutConfirm: string;
    email: string;
    password: string;
    changePassword: string;
    selectRole: string;
  };
  menu: {
    myProfile: string;
    darkMode: string;
    colorTheme: string;
    language: string;
    settings: string;
    securityPolicy: string;
    logout: string;
    team: string;
    teamManagement: string;
    teamManagementDesc: string;
  };
  settings: {
    title: string;
    pmsConnectivity: string;
    connectionStatus: string;
    connected: string;
    connectionError: string;
    syncing: string;
    notSynced: string;
    lastSync: string;
    records: string;
    forceSync: string;
    statistics: string;
    totalRooms: string;
    activeReservations: string;
    floors: string;
    administration: string;
    superAdmin: string;
    superAdminDesc: string;
    data: string;
    resetAllData: string;
    resetConfirm: string;
    resetDone: string;
  };
  roles: {
    super_admin: string;
    direction: string;
    reception: string;
    gouvernante: string;
    femme_de_chambre: string;
    maintenance: string;
    breakfast: string;
  };
  rooms: {
    room: string;
    rooms: string;
    floor: string;
    type: string;
    status: string;
    free: string;
    occupied: string;
    departure: string;
    stayover: string;
    outOfService: string;
    cleaning: string;
    inProgress: string;
    toValidate: string;
    validated: string;
    refused: string;
    vip: string;
    priority: string;
    normal: string;
    addRoom: string;
    roomDetails: string;
    assign: string;
    assignRooms: string;
  };
  housekeeping: {
    title: string;
    myDay: string;
    goodMorning: string;
    roomsToday: string;
    completed: string;
    startCleaning: string;
    finishCleaning: string;
    npd: string;
    blocked: string;
    checklist: string;
    reportProblem: string;
    lostFound: string;
    consumables: string;
    takePhoto: string;
  };
  economat: {
    title: string;
    stocks: string;
    consumptions: string;
    analytics: string;
    articles: string;
    lowStock: string;
    todayTotal: string;
    totalCost: string;
    restock: string;
    quantityToAdd: string;
    unitPrice: string;
    addToStock: string;
    categoryBreakdown: string;
    costPerRoom: string;
    criticalStock: string;
    allStocksOk: string;
    noArticlesFound: string;
    noConsumptions: string;
    dailyReport: string;
    weeklyReport: string;
    monthlyReport: string;
    priceConfig: string;
    editPrice: string;
  };
  hotel: {
    hotelName: string;
    contactEmail: string;
    phone: string;
    address: string;
    subscription: string;
    subscriptionPlan: string;
    basic: string;
    premium: string;
    enterprise: string;
    status: string;
    active: string;
    suspended: string;
    trial: string;
    startDate: string;
    endDate: string;
    createHotel: string;
    editHotel: string;
    hotelConfig: string;
    roomTypes: string;
    roomCategories: string;
    views: string;
    bathroomTypes: string;
    equipment: string;
    generateRooms: string;
    importExcel: string;
    pmsConfig: string;
  };
  direction: {
    title: string;
    occupancyRate: string;
    todayRevenue: string;
    departures: string;
    arrivals: string;
    cleanlinessRate: string;
    technicalIssues: string;
  };
  maintenance: {
    title: string;
    newTicket: string;
    openTickets: string;
    inProgress: string;
    resolved: string;
    priority: string;
    high: string;
    medium: string;
    low: string;
  };
  breakfast: {
    title: string;
    toPrepare: string;
    prepared: string;
    delivering: string;
    served: string;
    walkIn: string;
  };
  superadmin: {
    dashboard: string;
    hotels: string;
    users: string;
    support: string;
    logs: string;
    supportMode: string;
    activateSupport: string;
    exitSupport: string;
  };
};

export type Translations = TranslationKeys;

const fr: Translations = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    back: 'Retour',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    noData: 'Aucune donnée',
    all: 'Tout',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    thisYear: 'Cette année',
    export: 'Exporter',
    import: 'Importer',
    close: 'Fermer',
    retry: 'Réessayer',
    yes: 'Oui',
    no: 'Non',
  },
  auth: {
    login: 'Se connecter',
    logout: 'Se déconnecter',
    logoutConfirm: 'Voulez-vous vous déconnecter ?',
    email: 'Email',
    password: 'Mot de passe',
    changePassword: 'Changer mot de passe',
    selectRole: 'Sélectionner un rôle',
  },
  menu: {
    myProfile: 'Mon Profil',
    darkMode: 'Mode sombre',
    colorTheme: 'Thème couleur',
    language: 'Langue',
    settings: 'Paramètres',
    securityPolicy: 'Politique de sécurité',
    logout: 'Déconnexion',
    team: 'Équipe',
    teamManagement: "Gestion d'équipe",
    teamManagementDesc: "Inviter, gérer les membres de l'hôtel",
  },
  settings: {
    title: 'Paramètres',
    pmsConnectivity: 'Connectivité PMS',
    connectionStatus: 'État de la connexion',
    connected: 'Connecté',
    connectionError: 'Erreur de connexion',
    syncing: 'Synchronisation...',
    notSynced: 'Non synchronisé',
    lastSync: 'Dernière sync',
    records: 'Enregistrements',
    forceSync: 'Forcer la synchronisation',
    statistics: 'Statistiques',
    totalRooms: 'Total des chambres',
    activeReservations: 'Réservations actives',
    floors: 'Étages',
    administration: 'Administration',
    superAdmin: 'Super Admin',
    superAdminDesc: 'Gestion multi-hôtels, abonnements, support',
    data: 'Données',
    resetAllData: 'Réinitialiser toutes les données',
    resetConfirm: 'Cette action supprimera toutes les données locales. Continuer ?',
    resetDone: 'Données réinitialisées. Relancez l\'application.',
  },
  roles: {
    super_admin: 'Super Admin',
    direction: 'Direction',
    reception: 'Réception',
    gouvernante: 'Gouvernante',
    femme_de_chambre: 'Femme de chambre',
    maintenance: 'Maintenance',
    breakfast: 'Petit-déjeuner',
  },
  rooms: {
    room: 'Chambre',
    rooms: 'Chambres',
    floor: 'Étage',
    type: 'Type',
    status: 'Statut',
    free: 'Libre',
    occupied: 'Occupé',
    departure: 'Départ',
    stayover: 'Recouche',
    outOfService: 'Hors service',
    cleaning: 'Nettoyage',
    inProgress: 'En cours',
    toValidate: 'À valider',
    validated: 'Validée',
    refused: 'Refusée',
    vip: 'VIP',
    priority: 'Prioritaire',
    normal: 'Normal',
    addRoom: 'Nouvelle chambre',
    roomDetails: 'Détails chambre',
    assign: 'Assigner',
    assignRooms: 'Assigner des chambres',
  },
  housekeeping: {
    title: 'Mes chambres',
    myDay: 'Ma journée',
    goodMorning: 'Bonjour',
    roomsToday: 'chambres aujourd\'hui',
    completed: 'terminées',
    startCleaning: 'Commencer',
    finishCleaning: 'Terminer',
    npd: 'Ne Pas Déranger',
    blocked: 'Bloquée',
    checklist: 'Checklist',
    reportProblem: 'Signaler un problème',
    lostFound: 'Objet trouvé',
    consumables: 'Consommables',
    takePhoto: 'Prendre photo',
  },
  economat: {
    title: 'Économat',
    stocks: 'Stocks',
    consumptions: 'Consommations',
    analytics: 'Analyse',
    articles: 'Articles',
    lowStock: 'Stock bas',
    todayTotal: "Aujourd'hui",
    totalCost: 'Total',
    restock: 'Réapprovisionner',
    quantityToAdd: 'Quantité à ajouter',
    unitPrice: 'Prix unitaire (€)',
    addToStock: 'Ajouter au stock',
    categoryBreakdown: 'Répartition par catégorie',
    costPerRoom: 'Coût par chambre (Top 10)',
    criticalStock: 'Articles en stock critique',
    allStocksOk: 'Tous les stocks sont OK',
    noArticlesFound: 'Aucun article trouvé',
    noConsumptions: 'Aucune consommation enregistrée',
    dailyReport: 'Rapport journalier',
    weeklyReport: 'Rapport hebdomadaire',
    monthlyReport: 'Rapport mensuel',
    priceConfig: 'Configurer les prix',
    editPrice: 'Modifier le prix',
  },
  hotel: {
    hotelName: "Nom de l'hôtel",
    contactEmail: 'Email de contact',
    phone: 'Téléphone',
    address: 'Adresse',
    subscription: 'Abonnement',
    subscriptionPlan: "Plan d'abonnement",
    basic: 'Basique',
    premium: 'Premium',
    enterprise: 'Enterprise',
    status: 'Statut',
    active: 'Actif',
    suspended: 'Suspendu',
    trial: 'Essai',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    createHotel: "Créer l'hôtel",
    editHotel: "Modifier l'hôtel",
    hotelConfig: 'Configuration hôtel',
    roomTypes: 'Types de chambres',
    roomCategories: 'Catégories',
    views: 'Vues',
    bathroomTypes: 'Salle de bain',
    equipment: 'Équipements',
    generateRooms: 'Générer des chambres',
    importExcel: 'Importer Excel',
    pmsConfig: 'Configuration PMS',
  },
  direction: {
    title: 'Direction',
    occupancyRate: "Taux d'occupation",
    todayRevenue: 'Revenus du jour',
    departures: 'Départs',
    arrivals: 'Arrivées',
    cleanlinessRate: 'Taux de propreté',
    technicalIssues: 'Problèmes techniques',
  },
  maintenance: {
    title: 'Maintenance',
    newTicket: 'Nouveau ticket',
    openTickets: 'Tickets ouverts',
    inProgress: 'En cours',
    resolved: 'Résolu',
    priority: 'Priorité',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
  },
  breakfast: {
    title: 'Petit-déjeuner',
    toPrepare: 'À préparer',
    prepared: 'Préparé',
    delivering: 'En livraison',
    served: 'Servi',
    walkIn: 'Hors-forfait',
  },
  superadmin: {
    dashboard: 'Tableau de bord',
    hotels: 'Hôtels',
    users: 'Utilisateurs',
    support: 'Support',
    logs: 'Logs',
    supportMode: 'Mode support',
    activateSupport: 'Activer le mode support',
    exitSupport: 'Quitter le mode support',
  },
};

const en: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    back: 'Back',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    noData: 'No data',
    all: 'All',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    thisMonth: 'This month',
    thisYear: 'This year',
    export: 'Export',
    import: 'Import',
    close: 'Close',
    retry: 'Retry',
    yes: 'Yes',
    no: 'No',
  },
  auth: {
    login: 'Log in',
    logout: 'Log out',
    logoutConfirm: 'Do you want to log out?',
    email: 'Email',
    password: 'Password',
    changePassword: 'Change password',
    selectRole: 'Select a role',
  },
  menu: {
    myProfile: 'My Profile',
    darkMode: 'Dark mode',
    colorTheme: 'Color theme',
    language: 'Language',
    settings: 'Settings',
    securityPolicy: 'Security policy',
    logout: 'Log out',
    team: 'Team',
    teamManagement: 'Team management',
    teamManagementDesc: 'Invite and manage hotel members',
  },
  settings: {
    title: 'Settings',
    pmsConnectivity: 'PMS Connectivity',
    connectionStatus: 'Connection status',
    connected: 'Connected',
    connectionError: 'Connection error',
    syncing: 'Syncing...',
    notSynced: 'Not synced',
    lastSync: 'Last sync',
    records: 'Records',
    forceSync: 'Force sync',
    statistics: 'Statistics',
    totalRooms: 'Total rooms',
    activeReservations: 'Active reservations',
    floors: 'Floors',
    administration: 'Administration',
    superAdmin: 'Super Admin',
    superAdminDesc: 'Multi-hotel management, subscriptions, support',
    data: 'Data',
    resetAllData: 'Reset all data',
    resetConfirm: 'This will delete all local data. Continue?',
    resetDone: 'Data reset. Please restart the app.',
  },
  roles: {
    super_admin: 'Super Admin',
    direction: 'Management',
    reception: 'Reception',
    gouvernante: 'Head Housekeeper',
    femme_de_chambre: 'Housekeeper',
    maintenance: 'Maintenance',
    breakfast: 'Breakfast',
  },
  rooms: {
    room: 'Room',
    rooms: 'Rooms',
    floor: 'Floor',
    type: 'Type',
    status: 'Status',
    free: 'Free',
    occupied: 'Occupied',
    departure: 'Departure',
    stayover: 'Stayover',
    outOfService: 'Out of service',
    cleaning: 'Cleaning',
    inProgress: 'In progress',
    toValidate: 'To validate',
    validated: 'Validated',
    refused: 'Refused',
    vip: 'VIP',
    priority: 'Priority',
    normal: 'Normal',
    addRoom: 'New room',
    roomDetails: 'Room details',
    assign: 'Assign',
    assignRooms: 'Assign rooms',
  },
  housekeeping: {
    title: 'My rooms',
    myDay: 'My day',
    goodMorning: 'Good morning',
    roomsToday: 'rooms today',
    completed: 'completed',
    startCleaning: 'Start',
    finishCleaning: 'Finish',
    npd: 'Do Not Disturb',
    blocked: 'Blocked',
    checklist: 'Checklist',
    reportProblem: 'Report a problem',
    lostFound: 'Lost & Found',
    consumables: 'Consumables',
    takePhoto: 'Take photo',
  },
  economat: {
    title: 'Inventory',
    stocks: 'Stock',
    consumptions: 'Consumptions',
    analytics: 'Analytics',
    articles: 'Articles',
    lowStock: 'Low stock',
    todayTotal: 'Today',
    totalCost: 'Total',
    restock: 'Restock',
    quantityToAdd: 'Quantity to add',
    unitPrice: 'Unit price (€)',
    addToStock: 'Add to stock',
    categoryBreakdown: 'Category breakdown',
    costPerRoom: 'Cost per room (Top 10)',
    criticalStock: 'Critical stock items',
    allStocksOk: 'All stocks are OK',
    noArticlesFound: 'No articles found',
    noConsumptions: 'No consumptions recorded',
    dailyReport: 'Daily report',
    weeklyReport: 'Weekly report',
    monthlyReport: 'Monthly report',
    priceConfig: 'Configure prices',
    editPrice: 'Edit price',
  },
  hotel: {
    hotelName: 'Hotel name',
    contactEmail: 'Contact email',
    phone: 'Phone',
    address: 'Address',
    subscription: 'Subscription',
    subscriptionPlan: 'Subscription plan',
    basic: 'Basic',
    premium: 'Premium',
    enterprise: 'Enterprise',
    status: 'Status',
    active: 'Active',
    suspended: 'Suspended',
    trial: 'Trial',
    startDate: 'Start date',
    endDate: 'End date',
    createHotel: 'Create hotel',
    editHotel: 'Edit hotel',
    hotelConfig: 'Hotel configuration',
    roomTypes: 'Room types',
    roomCategories: 'Categories',
    views: 'Views',
    bathroomTypes: 'Bathroom',
    equipment: 'Equipment',
    generateRooms: 'Generate rooms',
    importExcel: 'Import Excel',
    pmsConfig: 'PMS Configuration',
  },
  direction: {
    title: 'Management',
    occupancyRate: 'Occupancy rate',
    todayRevenue: "Today's revenue",
    departures: 'Departures',
    arrivals: 'Arrivals',
    cleanlinessRate: 'Cleanliness rate',
    technicalIssues: 'Technical issues',
  },
  maintenance: {
    title: 'Maintenance',
    newTicket: 'New ticket',
    openTickets: 'Open tickets',
    inProgress: 'In progress',
    resolved: 'Resolved',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  breakfast: {
    title: 'Breakfast',
    toPrepare: 'To prepare',
    prepared: 'Prepared',
    delivering: 'Delivering',
    served: 'Served',
    walkIn: 'Walk-in',
  },
  superadmin: {
    dashboard: 'Dashboard',
    hotels: 'Hotels',
    users: 'Users',
    support: 'Support',
    logs: 'Logs',
    supportMode: 'Support mode',
    activateSupport: 'Activate support mode',
    exitSupport: 'Exit support mode',
  },
};

export const TRANSLATION_MAP: Record<LanguageId, Translations> = {
  fr,
  en,
  de: fr,
  es: fr,
  it: fr,
  pt: fr,
  ar: fr,
};
