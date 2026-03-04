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
    seeAll: string;
    seeDetails: string;
    selected: string;
    actions: string;
    apply: string;
    reset: string;
    total: string;
    unknown: string;
    none: string;
    ok: string;
  };
  auth: {
    login: string;
    logout: string;
    logoutConfirm: string;
    email: string;
    password: string;
    changePassword: string;
    selectRole: string;
    demoMode: string;
    demoModeDesc: string;
    smartHotelManagement: string;
    poweredBy: string;
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
    editName: string;
    chooseTheme: string;
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
    support: string;
  };
  rooms: {
    room: string;
    rooms: string;
    floor: string;
    floorN: string;
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
    noRoomFound: string;
    allFloors: string;
    roomCount: string;
    chamberCount: string;
    breakfastIncluded: string;
    breakfastNotIncluded: string;
    breakfastCol: string;
    gouvernanteCol: string;
    assignmentCol: string;
  };
  housekeeping: {
    title: string;
    assignedRooms: string;
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
    swipeHint: string;
    allDone: string;
    noAssigned: string;
    done: string;
    departures: string;
    stayovers: string;
    report: string;
    toRedo: string;
    finished: string;
  };
  gouvernante: {
    title: string;
    supervision: string;
    validation: string;
    team: string;
    stocks: string;
    activeMembers: string;
    todoRooms: string;
    allTodoRooms: string;
    tasks: string;
    kpis: string;
    toValidate: string;
    toRedo: string;
    validatedF: string;
    assign: string;
    reassign: string;
    validateRooms: string;
    history: string;
    fullEconomat: string;
    economatDesc: string;
    lowStockAlert: string;
    inventory: string;
    threshold: string;
    noInspectionPending: string;
    noActiveHousekeeper: string;
    allStatuses: string;
    statusFilter: string;
  };
  reception: {
    title: string;
    dashboard: string;
    housekeepingDashboard: string;
    filters: string;
    reports: string;
    occupiedRooms: string;
    toDo: string;
    urgent: string;
    delays: string;
    departuresOfDay: string;
    confirmDeparture: string;
    confirmDepartureMsg: string;
    noOccupiedSelected: string;
    actionImpossible: string;
    billing: string;
    billingAlert: string;
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
    occupation: string;
    cleanliness: string;
    todayAlerts: string;
    urgentInterventions: string;
    roomsToValidate: string;
    pdjToPrepare: string;
    roomStatuses: string;
    floorPlan: string;
    pdj: string;
    toPrepare: string;
    served: string;
    paying: string;
    consumptionsOfDay: string;
    todayTeam: string;
    historyLabel: string;
    maintenanceTracking: string;
    greeting: string;
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
    pending: string;
    noIntervention: string;
    reportedBy: string;
    tracking: string;
    allStatuses: string;
  };
  breakfast: {
    title: string;
    toPrepare: string;
    prepared: string;
    delivering: string;
    served: string;
    walkIn: string;
    kitchen: string;
    delivery: string;
    servedTab: string;
    noOrderToPrepare: string;
    noDeliveryInProgress: string;
    noHistory: string;
    markAs: string;
    confirmMark: string;
    paid: string;
    persons: string;
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
  security: {
    title: string;
    intro: string;
    dataCollection: string;
    dataCollectionDesc: string;
    purposes: string;
    purposesDesc: string;
    rights: string;
    rightsDesc: string;
    measures: string;
    measuresDesc: string;
    contact: string;
    contactDesc: string;
    compliance: string;
    complianceDesc: string;
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
    seeAll: 'Voir tout',
    seeDetails: 'Voir détails',
    selected: 'sélectionnée(s)',
    actions: 'Actions',
    apply: 'Appliquer',
    reset: 'Réinitialiser',
    total: 'Total',
    unknown: 'Inconnu',
    none: 'Aucun',
    ok: 'OK',
  },
  auth: {
    login: 'Se connecter',
    logout: 'Se déconnecter',
    logoutConfirm: 'Voulez-vous vous déconnecter ?',
    email: 'Email',
    password: 'Mot de passe',
    changePassword: 'Changer mot de passe',
    selectRole: 'Sélectionner un rôle',
    demoMode: 'Mode démo',
    demoModeDesc: 'Sélectionnez un profil pour accéder à l\'application',
    smartHotelManagement: 'Gestion Hôtelière Intelligente',
    poweredBy: 'Propulsé par FLOWTYM',
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
    editName: 'Modifier le nom',
    chooseTheme: 'Choisissez votre thème',
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
    support: 'Support',
  },
  rooms: {
    room: 'Chambre',
    rooms: 'Chambres',
    floor: 'Étage',
    floorN: 'Étage',
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
    noRoomFound: 'Aucune chambre trouvée',
    allFloors: 'Tous les étages',
    roomCount: 'chambres',
    chamberCount: 'ch.',
    breakfastIncluded: 'Inclus',
    breakfastNotIncluded: 'Non inclus',
    breakfastCol: 'Petit-déj.',
    gouvernanteCol: 'Gouvernante',
    assignmentCol: 'Assignation',
  },
  housekeeping: {
    title: 'Mes chambres',
    assignedRooms: 'Chambres assignées',
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
    swipeHint: '👉 Glisser → démarrer/terminer • ← signaler',
    allDone: 'Tout est fait !',
    noAssigned: 'Aucune chambre assignée',
    done: 'Terminées',
    departures: 'Départs',
    stayovers: 'Recouches',
    report: 'Signaler',
    toRedo: 'À refaire',
    finished: 'Terminé',
  },
  gouvernante: {
    title: 'Gouvernante',
    supervision: 'Supervision',
    validation: 'Validation',
    team: 'Équipe',
    stocks: 'Stocks',
    activeMembers: 'membres actifs',
    todoRooms: 'Soute chambres à faire',
    allTodoRooms: 'Toute chambres à faire',
    tasks: 'Tâches',
    kpis: 'KPIs',
    toValidate: 'À valider',
    toRedo: 'À refaire',
    validatedF: 'Validée',
    assign: 'Affecter',
    reassign: 'Réassigner',
    validateRooms: 'Valider chambres',
    history: 'Historique',
    fullEconomat: 'Économat complet',
    economatDesc: 'Stocks, consommations, analyses',
    lowStockAlert: 'article(s) en stock bas',
    inventory: 'Inventaire',
    threshold: 'Seuil',
    noInspectionPending: 'Aucune inspection en attente',
    noActiveHousekeeper: 'Aucune femme de chambre active',
    allStatuses: 'Tous',
    statusFilter: 'Statut',
  },
  reception: {
    title: 'Réception',
    dashboard: 'Dashboard',
    housekeepingDashboard: 'Dashboard',
    filters: 'Filtres',
    reports: 'Reports',
    occupiedRooms: 'Occupées',
    toDo: 'À faire',
    urgent: 'Urgentes',
    delays: 'Retards',
    departuresOfDay: 'Départs',
    confirmDeparture: 'Confirmer le départ',
    confirmDepartureMsg: 'Confirmer le départ pour',
    noOccupiedSelected: 'Aucune chambre occupée sélectionnée.',
    actionImpossible: 'Action impossible',
    billing: 'Facturation',
    billingAlert: 'PDJ à facturer',
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
    occupation: 'Occupation',
    cleanliness: 'Propreté',
    todayAlerts: 'Alertes du jour',
    urgentInterventions: 'intervention(s) urgente(s)',
    roomsToValidate: 'chambre(s) à valider',
    pdjToPrepare: 'PDJ à préparer',
    roomStatuses: 'Statuts des chambres',
    floorPlan: 'Plan des étages',
    pdj: 'PDJ',
    toPrepare: 'À préparer',
    served: 'Servis',
    paying: 'Payants',
    consumptionsOfDay: 'Consommations du jour',
    todayTeam: 'Équipe du jour',
    historyLabel: 'Historique',
    maintenanceTracking: 'Suivi maintenance',
    greeting: 'Bonjour',
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
    pending: 'En attente',
    noIntervention: 'Aucune intervention',
    reportedBy: 'Signalé par',
    tracking: 'Suivi',
    allStatuses: 'Tous statuts',
  },
  breakfast: {
    title: 'Petit-déjeuner',
    toPrepare: 'À préparer',
    prepared: 'Préparé',
    delivering: 'En livraison',
    served: 'Servi',
    walkIn: 'Hors-forfait',
    kitchen: 'Cuisine',
    delivery: 'Livraison',
    servedTab: 'Servis',
    noOrderToPrepare: 'Aucune commande à préparer',
    noDeliveryInProgress: 'Aucune livraison en cours',
    noHistory: 'Aucun historique',
    markAs: 'Marquer comme',
    confirmMark: 'Confirmer',
    paid: 'Payant',
    persons: 'pers.',
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
  security: {
    title: 'Politique de sécurité et confidentialité',
    intro: 'FLOWTYM s\'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables en matière de protection des données.',
    dataCollection: 'Collecte des données',
    dataCollectionDesc: 'Nous collectons uniquement les données nécessaires au fonctionnement du service de gestion hôtelière : informations sur les hôtels, les chambres, les employés et les opérations quotidiennes. Aucune donnée client personnelle n\'est stockée au-delà de ce qui est nécessaire pour le service.',
    purposes: 'Finalités du traitement',
    purposesDesc: 'Les données sont utilisées exclusivement pour la gestion opérationnelle de l\'hôtel (housekeeping, maintenance, petit-déjeuner, stocks), la facturation des services, et l\'amélioration de la qualité du service.',
    rights: 'Droits des personnes',
    rightsDesc: 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, de suppression, de portabilité et d\'opposition au traitement de vos données. Pour exercer ces droits, contactez notre Délégué à la Protection des Données.',
    measures: 'Mesures de sécurité',
    measuresDesc: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des données en transit et au repos, contrôle d\'accès basé sur les rôles (RBAC), journalisation des actions, sauvegardes régulières et audits de sécurité.',
    contact: 'Contact DPO',
    contactDesc: 'Pour toute question relative à la protection de vos données, contactez notre DPO à l\'adresse : dpo@flowtym.com',
    compliance: 'Conformité',
    complianceDesc: 'FLOWTYM est conforme au RGPD (UE 2016/679), à la loi Informatique et Libertés, et aux recommandations de la CNIL. Les données sont hébergées dans l\'Union Européenne.',
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
    seeAll: 'See all',
    seeDetails: 'See details',
    selected: 'selected',
    actions: 'Actions',
    apply: 'Apply',
    reset: 'Reset',
    total: 'Total',
    unknown: 'Unknown',
    none: 'None',
    ok: 'OK',
  },
  auth: {
    login: 'Log in',
    logout: 'Log out',
    logoutConfirm: 'Do you want to log out?',
    email: 'Email',
    password: 'Password',
    changePassword: 'Change password',
    selectRole: 'Select a role',
    demoMode: 'Demo mode',
    demoModeDesc: 'Select a profile to access the application',
    smartHotelManagement: 'Smart Hotel Management',
    poweredBy: 'Powered by FLOWTYM',
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
    editName: 'Edit name',
    chooseTheme: 'Choose your theme',
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
    support: 'Support',
  },
  rooms: {
    room: 'Room',
    rooms: 'Rooms',
    floor: 'Floor',
    floorN: 'Floor',
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
    noRoomFound: 'No rooms found',
    allFloors: 'All floors',
    roomCount: 'rooms',
    chamberCount: 'rm.',
    breakfastIncluded: 'Included',
    breakfastNotIncluded: 'Not included',
    breakfastCol: 'Breakfast',
    gouvernanteCol: 'Supervisor',
    assignmentCol: 'Assignment',
  },
  housekeeping: {
    title: 'My rooms',
    assignedRooms: 'Assigned rooms',
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
    swipeHint: '👉 Swipe → start/finish • ← report',
    allDone: 'All done!',
    noAssigned: 'No assigned rooms',
    done: 'Done',
    departures: 'Departures',
    stayovers: 'Stayovers',
    report: 'Report',
    toRedo: 'To redo',
    finished: 'Finished',
  },
  gouvernante: {
    title: 'Head Housekeeper',
    supervision: 'Supervision',
    validation: 'Validation',
    team: 'Team',
    stocks: 'Stocks',
    activeMembers: 'active members',
    todoRooms: 'Rooms to clean',
    allTodoRooms: 'All rooms to clean',
    tasks: 'Tasks',
    kpis: 'KPIs',
    toValidate: 'To validate',
    toRedo: 'To redo',
    validatedF: 'Validated',
    assign: 'Assign',
    reassign: 'Reassign',
    validateRooms: 'Validate rooms',
    history: 'History',
    fullEconomat: 'Full inventory',
    economatDesc: 'Stocks, consumptions, analytics',
    lowStockAlert: 'item(s) low stock',
    inventory: 'Inventory',
    threshold: 'Threshold',
    noInspectionPending: 'No pending inspections',
    noActiveHousekeeper: 'No active housekeepers',
    allStatuses: 'All',
    statusFilter: 'Status',
  },
  reception: {
    title: 'Reception',
    dashboard: 'Dashboard',
    housekeepingDashboard: 'Dashboard',
    filters: 'Filters',
    reports: 'Reports',
    occupiedRooms: 'Occupied',
    toDo: 'To do',
    urgent: 'Urgent',
    delays: 'Delays',
    departuresOfDay: 'Departures',
    confirmDeparture: 'Confirm departure',
    confirmDepartureMsg: 'Confirm departure for',
    noOccupiedSelected: 'No occupied rooms selected.',
    actionImpossible: 'Action impossible',
    billing: 'Billing',
    billingAlert: 'Breakfast to invoice',
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
    occupation: 'Occupancy',
    cleanliness: 'Cleanliness',
    todayAlerts: 'Today\'s alerts',
    urgentInterventions: 'urgent intervention(s)',
    roomsToValidate: 'room(s) to validate',
    pdjToPrepare: 'Breakfast to prepare',
    roomStatuses: 'Room statuses',
    floorPlan: 'Floor plan',
    pdj: 'Breakfast',
    toPrepare: 'To prepare',
    served: 'Served',
    paying: 'Paying',
    consumptionsOfDay: 'Today\'s consumptions',
    todayTeam: 'Today\'s team',
    historyLabel: 'History',
    maintenanceTracking: 'Maintenance tracking',
    greeting: 'Good morning',
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
    pending: 'Pending',
    noIntervention: 'No interventions',
    reportedBy: 'Reported by',
    tracking: 'Tracking',
    allStatuses: 'All statuses',
  },
  breakfast: {
    title: 'Breakfast',
    toPrepare: 'To prepare',
    prepared: 'Prepared',
    delivering: 'Delivering',
    served: 'Served',
    walkIn: 'Walk-in',
    kitchen: 'Kitchen',
    delivery: 'Delivery',
    servedTab: 'Served',
    noOrderToPrepare: 'No orders to prepare',
    noDeliveryInProgress: 'No deliveries in progress',
    noHistory: 'No history',
    markAs: 'Mark as',
    confirmMark: 'Confirm',
    paid: 'Paid',
    persons: 'pers.',
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
  security: {
    title: 'Security and Privacy Policy',
    intro: 'FLOWTYM is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable data protection laws.',
    dataCollection: 'Data Collection',
    dataCollectionDesc: 'We only collect data necessary for the hotel management service: information about hotels, rooms, employees, and daily operations. No personal client data is stored beyond what is necessary for the service.',
    purposes: 'Processing Purposes',
    purposesDesc: 'Data is used exclusively for hotel operational management (housekeeping, maintenance, breakfast, inventory), service billing, and improving service quality.',
    rights: 'Individual Rights',
    rightsDesc: 'Under the GDPR, you have the right to access, rectify, delete, port, and object to the processing of your data. To exercise these rights, contact our Data Protection Officer.',
    measures: 'Security Measures',
    measuresDesc: 'We implement appropriate technical and organizational measures: data encryption in transit and at rest, role-based access control (RBAC), action logging, regular backups, and security audits.',
    contact: 'DPO Contact',
    contactDesc: 'For any questions regarding the protection of your data, contact our DPO at: dpo@flowtym.com',
    compliance: 'Compliance',
    complianceDesc: 'FLOWTYM complies with GDPR (EU 2016/679), the French Data Protection Act, and CNIL recommendations. Data is hosted within the European Union.',
  },
};

const de: Translations = {
  common: { save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten', add: 'Hinzufügen', search: 'Suchen', filter: 'Filtern', back: 'Zurück', confirm: 'Bestätigen', loading: 'Laden...', error: 'Fehler', success: 'Erfolg', noData: 'Keine Daten', all: 'Alle', today: 'Heute', yesterday: 'Gestern', thisWeek: 'Diese Woche', thisMonth: 'Dieser Monat', thisYear: 'Dieses Jahr', export: 'Exportieren', import: 'Importieren', close: 'Schließen', retry: 'Erneut versuchen', yes: 'Ja', no: 'Nein', seeAll: 'Alle anzeigen', seeDetails: 'Details anzeigen', selected: 'ausgewählt', actions: 'Aktionen', apply: 'Anwenden', reset: 'Zurücksetzen', total: 'Gesamt', unknown: 'Unbekannt', none: 'Keine', ok: 'OK' },
  auth: { login: 'Anmelden', logout: 'Abmelden', logoutConfirm: 'Möchten Sie sich abmelden?', email: 'E-Mail', password: 'Passwort', changePassword: 'Passwort ändern', selectRole: 'Rolle auswählen', demoMode: 'Demo-Modus', demoModeDesc: 'Wählen Sie ein Profil für den Zugang zur Anwendung', smartHotelManagement: 'Intelligentes Hotelmanagement', poweredBy: 'Powered by FLOWTYM' },
  menu: { myProfile: 'Mein Profil', darkMode: 'Dunkelmodus', colorTheme: 'Farbthema', language: 'Sprache', settings: 'Einstellungen', securityPolicy: 'Sicherheitsrichtlinie', logout: 'Abmelden', team: 'Team', teamManagement: 'Teamverwaltung', teamManagementDesc: 'Hotelmitglieder einladen und verwalten', editName: 'Name bearbeiten', chooseTheme: 'Wählen Sie Ihr Thema' },
  settings: { title: 'Einstellungen', pmsConnectivity: 'PMS-Konnektivität', connectionStatus: 'Verbindungsstatus', connected: 'Verbunden', connectionError: 'Verbindungsfehler', syncing: 'Synchronisierung...', notSynced: 'Nicht synchronisiert', lastSync: 'Letzte Sync', records: 'Datensätze', forceSync: 'Synchronisierung erzwingen', statistics: 'Statistiken', totalRooms: 'Zimmer gesamt', activeReservations: 'Aktive Reservierungen', floors: 'Etagen', administration: 'Verwaltung', superAdmin: 'Super Admin', superAdminDesc: 'Multi-Hotel-Verwaltung, Abonnements, Support', data: 'Daten', resetAllData: 'Alle Daten zurücksetzen', resetConfirm: 'Alle lokalen Daten werden gelöscht. Fortfahren?', resetDone: 'Daten zurückgesetzt. Bitte App neu starten.' },
  roles: { super_admin: 'Super Admin', direction: 'Direktion', reception: 'Rezeption', gouvernante: 'Hausdame', femme_de_chambre: 'Zimmermädchen', maintenance: 'Wartung', breakfast: 'Frühstück', support: 'Support' },
  rooms: { room: 'Zimmer', rooms: 'Zimmer', floor: 'Etage', floorN: 'Etage', type: 'Typ', status: 'Status', free: 'Frei', occupied: 'Belegt', departure: 'Abreise', stayover: 'Übernachtung', outOfService: 'Außer Betrieb', cleaning: 'Reinigung', inProgress: 'In Bearbeitung', toValidate: 'Zu prüfen', validated: 'Geprüft', refused: 'Abgelehnt', vip: 'VIP', priority: 'Priorität', normal: 'Normal', addRoom: 'Neues Zimmer', roomDetails: 'Zimmerdetails', assign: 'Zuweisen', assignRooms: 'Zimmer zuweisen', noRoomFound: 'Keine Zimmer gefunden', allFloors: 'Alle Etagen', roomCount: 'Zimmer', chamberCount: 'Zi.', breakfastIncluded: 'Inkl.', breakfastNotIncluded: 'Nicht inkl.', breakfastCol: 'Frühstück', gouvernanteCol: 'Hausdame', assignmentCol: 'Zuweisung' },
  housekeeping: { title: 'Meine Zimmer', assignedRooms: 'Zugewiesene Zimmer', myDay: 'Mein Tag', goodMorning: 'Guten Morgen', roomsToday: 'Zimmer heute', completed: 'erledigt', startCleaning: 'Starten', finishCleaning: 'Fertig', npd: 'Bitte nicht stören', blocked: 'Gesperrt', checklist: 'Checkliste', reportProblem: 'Problem melden', lostFound: 'Fundsachen', consumables: 'Verbrauchsmaterial', takePhoto: 'Foto aufnehmen', swipeHint: '👉 Wischen → starten/beenden • ← melden', allDone: 'Alles erledigt!', noAssigned: 'Keine zugewiesenen Zimmer', done: 'Erledigt', departures: 'Abreisen', stayovers: 'Übernachtungen', report: 'Melden', toRedo: 'Nacharbeiten', finished: 'Fertig' },
  gouvernante: { title: 'Hausdame', supervision: 'Überwachung', validation: 'Validierung', team: 'Team', stocks: 'Bestände', activeMembers: 'aktive Mitglieder', todoRooms: 'Zimmer zu reinigen', allTodoRooms: 'Alle zu reinigenden Zimmer', tasks: 'Aufgaben', kpis: 'KPIs', toValidate: 'Zu prüfen', toRedo: 'Nacharbeiten', validatedF: 'Geprüft', assign: 'Zuweisen', reassign: 'Neu zuweisen', validateRooms: 'Zimmer validieren', history: 'Verlauf', fullEconomat: 'Vollständige Lagerverwaltung', economatDesc: 'Bestände, Verbrauch, Analysen', lowStockAlert: 'Artikel mit niedrigem Bestand', inventory: 'Inventar', threshold: 'Schwelle', noInspectionPending: 'Keine ausstehenden Inspektionen', noActiveHousekeeper: 'Keine aktiven Zimmermädchen', allStatuses: 'Alle', statusFilter: 'Status' },
  reception: { title: 'Rezeption', dashboard: 'Dashboard', housekeepingDashboard: 'Dashboard', filters: 'Filter', reports: 'Berichte', occupiedRooms: 'Belegt', toDo: 'Zu erledigen', urgent: 'Dringend', delays: 'Verzögerungen', departuresOfDay: 'Abreisen', confirmDeparture: 'Abreise bestätigen', confirmDepartureMsg: 'Abreise bestätigen für', noOccupiedSelected: 'Keine belegten Zimmer ausgewählt.', actionImpossible: 'Aktion unmöglich', billing: 'Abrechnung', billingAlert: 'Frühstück abzurechnen' },
  economat: { title: 'Lagerverwaltung', stocks: 'Bestand', consumptions: 'Verbrauch', analytics: 'Analyse', articles: 'Artikel', lowStock: 'Niedriger Bestand', todayTotal: 'Heute', totalCost: 'Gesamt', restock: 'Nachbestellen', quantityToAdd: 'Menge hinzufügen', unitPrice: 'Stückpreis (€)', addToStock: 'Zum Bestand hinzufügen', categoryBreakdown: 'Aufschlüsselung nach Kategorie', costPerRoom: 'Kosten pro Zimmer (Top 10)', criticalStock: 'Kritischer Bestand', allStocksOk: 'Alle Bestände OK', noArticlesFound: 'Keine Artikel gefunden', noConsumptions: 'Kein Verbrauch erfasst', dailyReport: 'Tagesbericht', weeklyReport: 'Wochenbericht', monthlyReport: 'Monatsbericht', priceConfig: 'Preise konfigurieren', editPrice: 'Preis bearbeiten' },
  hotel: { hotelName: 'Hotelname', contactEmail: 'Kontakt-E-Mail', phone: 'Telefon', address: 'Adresse', subscription: 'Abonnement', subscriptionPlan: 'Abonnement-Plan', basic: 'Basis', premium: 'Premium', enterprise: 'Enterprise', status: 'Status', active: 'Aktiv', suspended: 'Gesperrt', trial: 'Testphase', startDate: 'Startdatum', endDate: 'Enddatum', createHotel: 'Hotel erstellen', editHotel: 'Hotel bearbeiten', hotelConfig: 'Hotelkonfiguration', roomTypes: 'Zimmertypen', roomCategories: 'Kategorien', views: 'Aussicht', bathroomTypes: 'Badezimmer', equipment: 'Ausstattung', generateRooms: 'Zimmer generieren', importExcel: 'Excel importieren', pmsConfig: 'PMS-Konfiguration' },
  direction: { title: 'Direktion', occupancyRate: 'Auslastung', todayRevenue: 'Tagesumsatz', departures: 'Abreisen', arrivals: 'Ankünfte', cleanlinessRate: 'Sauberkeitsrate', technicalIssues: 'Technische Probleme', occupation: 'Auslastung', cleanliness: 'Sauberkeit', todayAlerts: 'Heutige Meldungen', urgentInterventions: 'dringende Intervention(en)', roomsToValidate: 'Zimmer zu prüfen', pdjToPrepare: 'Frühstück vorzubereiten', roomStatuses: 'Zimmerstatus', floorPlan: 'Etagenplan', pdj: 'Frühstück', toPrepare: 'Vorzubereiten', served: 'Serviert', paying: 'Zahlend', consumptionsOfDay: 'Tagesverbrauch', todayTeam: 'Heutiges Team', historyLabel: 'Verlauf', maintenanceTracking: 'Wartungsverfolgung', greeting: 'Guten Morgen' },
  maintenance: { title: 'Wartung', newTicket: 'Neues Ticket', openTickets: 'Offene Tickets', inProgress: 'In Bearbeitung', resolved: 'Gelöst', priority: 'Priorität', high: 'Hoch', medium: 'Mittel', low: 'Niedrig', pending: 'Ausstehend', noIntervention: 'Keine Interventionen', reportedBy: 'Gemeldet von', tracking: 'Verfolgung', allStatuses: 'Alle Status' },
  breakfast: { title: 'Frühstück', toPrepare: 'Vorzubereiten', prepared: 'Zubereitet', delivering: 'In Zustellung', served: 'Serviert', walkIn: 'Laufkundschaft', kitchen: 'Küche', delivery: 'Lieferung', servedTab: 'Serviert', noOrderToPrepare: 'Keine Bestellungen vorzubereiten', noDeliveryInProgress: 'Keine laufenden Lieferungen', noHistory: 'Kein Verlauf', markAs: 'Markieren als', confirmMark: 'Bestätigen', paid: 'Zahlend', persons: 'Pers.' },
  superadmin: { dashboard: 'Dashboard', hotels: 'Hotels', users: 'Benutzer', support: 'Support', logs: 'Protokolle', supportMode: 'Supportmodus', activateSupport: 'Supportmodus aktivieren', exitSupport: 'Supportmodus verlassen' },
  security: { title: 'Sicherheits- und Datenschutzrichtlinie', intro: 'FLOWTYM verpflichtet sich, Ihre persönlichen Daten gemäß der Datenschutz-Grundverordnung (DSGVO) und den geltenden Datenschutzgesetzen zu schützen.', dataCollection: 'Datenerhebung', dataCollectionDesc: 'Wir erheben nur die für den Hotelverwaltungsdienst notwendigen Daten: Informationen über Hotels, Zimmer, Mitarbeiter und den täglichen Betrieb.', purposes: 'Verarbeitungszwecke', purposesDesc: 'Die Daten werden ausschließlich für die operative Hotelverwaltung, Abrechnung und Qualitätsverbesserung verwendet.', rights: 'Rechte der Betroffenen', rightsDesc: 'Gemäß der DSGVO haben Sie das Recht auf Zugang, Berichtigung, Löschung, Übertragbarkeit und Widerspruch gegen die Verarbeitung Ihrer Daten.', measures: 'Sicherheitsmaßnahmen', measuresDesc: 'Wir implementieren angemessene technische und organisatorische Maßnahmen: Datenverschlüsselung, rollenbasierte Zugriffskontrolle (RBAC), Aktionsprotokollierung und regelmäßige Sicherheitsaudits.', contact: 'DSB Kontakt', contactDesc: 'Für Fragen zum Datenschutz kontaktieren Sie unseren DSB: dpo@flowtym.com', compliance: 'Compliance', complianceDesc: 'FLOWTYM entspricht der DSGVO (EU 2016/679). Die Daten werden innerhalb der EU gehostet.' },
};

const es: Translations = {
  common: { save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', add: 'Añadir', search: 'Buscar', filter: 'Filtrar', back: 'Volver', confirm: 'Confirmar', loading: 'Cargando...', error: 'Error', success: 'Éxito', noData: 'Sin datos', all: 'Todo', today: 'Hoy', yesterday: 'Ayer', thisWeek: 'Esta semana', thisMonth: 'Este mes', thisYear: 'Este año', export: 'Exportar', import: 'Importar', close: 'Cerrar', retry: 'Reintentar', yes: 'Sí', no: 'No', seeAll: 'Ver todo', seeDetails: 'Ver detalles', selected: 'seleccionada(s)', actions: 'Acciones', apply: 'Aplicar', reset: 'Restablecer', total: 'Total', unknown: 'Desconocido', none: 'Ninguno', ok: 'OK' },
  auth: { login: 'Iniciar sesión', logout: 'Cerrar sesión', logoutConfirm: '¿Desea cerrar sesión?', email: 'Correo electrónico', password: 'Contraseña', changePassword: 'Cambiar contraseña', selectRole: 'Seleccionar rol', demoMode: 'Modo demo', demoModeDesc: 'Seleccione un perfil para acceder a la aplicación', smartHotelManagement: 'Gestión Hotelera Inteligente', poweredBy: 'Powered by FLOWTYM' },
  menu: { myProfile: 'Mi perfil', darkMode: 'Modo oscuro', colorTheme: 'Tema de color', language: 'Idioma', settings: 'Ajustes', securityPolicy: 'Política de seguridad', logout: 'Cerrar sesión', team: 'Equipo', teamManagement: 'Gestión del equipo', teamManagementDesc: 'Invitar y gestionar miembros del hotel', editName: 'Editar nombre', chooseTheme: 'Elija su tema' },
  settings: { title: 'Ajustes', pmsConnectivity: 'Conectividad PMS', connectionStatus: 'Estado de conexión', connected: 'Conectado', connectionError: 'Error de conexión', syncing: 'Sincronizando...', notSynced: 'No sincronizado', lastSync: 'Última sincronización', records: 'Registros', forceSync: 'Forzar sincronización', statistics: 'Estadísticas', totalRooms: 'Total de habitaciones', activeReservations: 'Reservas activas', floors: 'Plantas', administration: 'Administración', superAdmin: 'Super Admin', superAdminDesc: 'Gestión multihotel, suscripciones, soporte', data: 'Datos', resetAllData: 'Restablecer todos los datos', resetConfirm: 'Se eliminarán todos los datos locales. ¿Continuar?', resetDone: 'Datos restablecidos. Reinicie la aplicación.' },
  roles: { super_admin: 'Super Admin', direction: 'Dirección', reception: 'Recepción', gouvernante: 'Gobernanta', femme_de_chambre: 'Camarera de piso', maintenance: 'Mantenimiento', breakfast: 'Desayuno', support: 'Soporte' },
  rooms: { room: 'Habitación', rooms: 'Habitaciones', floor: 'Planta', floorN: 'Planta', type: 'Tipo', status: 'Estado', free: 'Libre', occupied: 'Ocupada', departure: 'Salida', stayover: 'Estancia', outOfService: 'Fuera de servicio', cleaning: 'Limpieza', inProgress: 'En curso', toValidate: 'Por validar', validated: 'Validada', refused: 'Rechazada', vip: 'VIP', priority: 'Prioritaria', normal: 'Normal', addRoom: 'Nueva habitación', roomDetails: 'Detalles habitación', assign: 'Asignar', assignRooms: 'Asignar habitaciones', noRoomFound: 'No se encontraron habitaciones', allFloors: 'Todas las plantas', roomCount: 'habitaciones', chamberCount: 'hab.', breakfastIncluded: 'Incluido', breakfastNotIncluded: 'No incluido', breakfastCol: 'Desayuno', gouvernanteCol: 'Gobernanta', assignmentCol: 'Asignación' },
  housekeeping: { title: 'Mis habitaciones', assignedRooms: 'Habitaciones asignadas', myDay: 'Mi día', goodMorning: 'Buenos días', roomsToday: 'habitaciones hoy', completed: 'completadas', startCleaning: 'Iniciar', finishCleaning: 'Terminar', npd: 'No molestar', blocked: 'Bloqueada', checklist: 'Lista de verificación', reportProblem: 'Reportar problema', lostFound: 'Objetos perdidos', consumables: 'Consumibles', takePhoto: 'Tomar foto', swipeHint: '👉 Deslizar → iniciar/terminar • ← reportar', allDone: '¡Todo hecho!', noAssigned: 'Sin habitaciones asignadas', done: 'Terminadas', departures: 'Salidas', stayovers: 'Estancias', report: 'Reportar', toRedo: 'Rehacer', finished: 'Terminado' },
  gouvernante: { title: 'Gobernanta', supervision: 'Supervisión', validation: 'Validación', team: 'Equipo', stocks: 'Existencias', activeMembers: 'miembros activos', todoRooms: 'Habitaciones pendientes', allTodoRooms: 'Todas las habitaciones pendientes', tasks: 'Tareas', kpis: 'KPIs', toValidate: 'Por validar', toRedo: 'Rehacer', validatedF: 'Validada', assign: 'Asignar', reassign: 'Reasignar', validateRooms: 'Validar habitaciones', history: 'Historial', fullEconomat: 'Economato completo', economatDesc: 'Existencias, consumos, análisis', lowStockAlert: 'artículo(s) con stock bajo', inventory: 'Inventario', threshold: 'Umbral', noInspectionPending: 'Sin inspecciones pendientes', noActiveHousekeeper: 'Sin camareras activas', allStatuses: 'Todos', statusFilter: 'Estado' },
  reception: { title: 'Recepción', dashboard: 'Panel', housekeepingDashboard: 'Panel', filters: 'Filtros', reports: 'Informes', occupiedRooms: 'Ocupadas', toDo: 'Pendientes', urgent: 'Urgentes', delays: 'Retrasos', departuresOfDay: 'Salidas', confirmDeparture: 'Confirmar salida', confirmDepartureMsg: 'Confirmar salida para', noOccupiedSelected: 'No hay habitaciones ocupadas seleccionadas.', actionImpossible: 'Acción imposible', billing: 'Facturación', billingAlert: 'Desayuno por facturar' },
  economat: { title: 'Economato', stocks: 'Existencias', consumptions: 'Consumos', analytics: 'Análisis', articles: 'Artículos', lowStock: 'Stock bajo', todayTotal: 'Hoy', totalCost: 'Total', restock: 'Reabastecer', quantityToAdd: 'Cantidad a añadir', unitPrice: 'Precio unitario (€)', addToStock: 'Añadir al stock', categoryBreakdown: 'Desglose por categoría', costPerRoom: 'Coste por habitación (Top 10)', criticalStock: 'Stock crítico', allStocksOk: 'Todos los stocks OK', noArticlesFound: 'Sin artículos', noConsumptions: 'Sin consumos registrados', dailyReport: 'Informe diario', weeklyReport: 'Informe semanal', monthlyReport: 'Informe mensual', priceConfig: 'Configurar precios', editPrice: 'Editar precio' },
  hotel: { hotelName: 'Nombre del hotel', contactEmail: 'Email de contacto', phone: 'Teléfono', address: 'Dirección', subscription: 'Suscripción', subscriptionPlan: 'Plan de suscripción', basic: 'Básico', premium: 'Premium', enterprise: 'Enterprise', status: 'Estado', active: 'Activo', suspended: 'Suspendido', trial: 'Prueba', startDate: 'Fecha de inicio', endDate: 'Fecha de fin', createHotel: 'Crear hotel', editHotel: 'Editar hotel', hotelConfig: 'Configuración del hotel', roomTypes: 'Tipos de habitación', roomCategories: 'Categorías', views: 'Vistas', bathroomTypes: 'Baño', equipment: 'Equipamiento', generateRooms: 'Generar habitaciones', importExcel: 'Importar Excel', pmsConfig: 'Configuración PMS' },
  direction: { title: 'Dirección', occupancyRate: 'Tasa de ocupación', todayRevenue: 'Ingresos del día', departures: 'Salidas', arrivals: 'Llegadas', cleanlinessRate: 'Tasa de limpieza', technicalIssues: 'Problemas técnicos', occupation: 'Ocupación', cleanliness: 'Limpieza', todayAlerts: 'Alertas del día', urgentInterventions: 'intervención(es) urgente(s)', roomsToValidate: 'habitación(es) por validar', pdjToPrepare: 'Desayuno por preparar', roomStatuses: 'Estado de habitaciones', floorPlan: 'Plano de plantas', pdj: 'Desayuno', toPrepare: 'Por preparar', served: 'Servidos', paying: 'De pago', consumptionsOfDay: 'Consumos del día', todayTeam: 'Equipo del día', historyLabel: 'Historial', maintenanceTracking: 'Seguimiento de mantenimiento', greeting: 'Buenos días' },
  maintenance: { title: 'Mantenimiento', newTicket: 'Nuevo ticket', openTickets: 'Tickets abiertos', inProgress: 'En curso', resolved: 'Resuelto', priority: 'Prioridad', high: 'Alta', medium: 'Media', low: 'Baja', pending: 'Pendiente', noIntervention: 'Sin intervenciones', reportedBy: 'Reportado por', tracking: 'Seguimiento', allStatuses: 'Todos los estados' },
  breakfast: { title: 'Desayuno', toPrepare: 'Por preparar', prepared: 'Preparado', delivering: 'En entrega', served: 'Servido', walkIn: 'Sin reserva', kitchen: 'Cocina', delivery: 'Entrega', servedTab: 'Servidos', noOrderToPrepare: 'Sin pedidos por preparar', noDeliveryInProgress: 'Sin entregas en curso', noHistory: 'Sin historial', markAs: 'Marcar como', confirmMark: 'Confirmar', paid: 'De pago', persons: 'pers.' },
  superadmin: { dashboard: 'Panel de control', hotels: 'Hoteles', users: 'Usuarios', support: 'Soporte', logs: 'Registros', supportMode: 'Modo soporte', activateSupport: 'Activar modo soporte', exitSupport: 'Salir del modo soporte' },
  security: { title: 'Política de seguridad y privacidad', intro: 'FLOWTYM se compromete a proteger sus datos personales de acuerdo con el Reglamento General de Protección de Datos (RGPD) y las leyes aplicables.', dataCollection: 'Recopilación de datos', dataCollectionDesc: 'Solo recopilamos datos necesarios para el servicio de gestión hotelera.', purposes: 'Fines del tratamiento', purposesDesc: 'Los datos se utilizan exclusivamente para la gestión operativa del hotel, facturación y mejora de la calidad.', rights: 'Derechos individuales', rightsDesc: 'De acuerdo con el RGPD, usted tiene derecho de acceso, rectificación, supresión, portabilidad y oposición.', measures: 'Medidas de seguridad', measuresDesc: 'Implementamos medidas técnicas y organizativas apropiadas: cifrado de datos, control de acceso basado en roles, registro de acciones y auditorías de seguridad.', contact: 'Contacto DPD', contactDesc: 'Para preguntas sobre protección de datos, contacte a nuestro DPD: dpo@flowtym.com', compliance: 'Cumplimiento', complianceDesc: 'FLOWTYM cumple con el RGPD (UE 2016/679). Los datos se alojan en la Unión Europea.' },
};

const it: Translations = {
  common: { save: 'Salvare', cancel: 'Annullare', delete: 'Eliminare', edit: 'Modificare', add: 'Aggiungere', search: 'Cercare', filter: 'Filtrare', back: 'Indietro', confirm: 'Confermare', loading: 'Caricamento...', error: 'Errore', success: 'Successo', noData: 'Nessun dato', all: 'Tutto', today: 'Oggi', yesterday: 'Ieri', thisWeek: 'Questa settimana', thisMonth: 'Questo mese', thisYear: "Quest'anno", export: 'Esportare', import: 'Importare', close: 'Chiudere', retry: 'Riprovare', yes: 'Sì', no: 'No', seeAll: 'Vedi tutto', seeDetails: 'Vedi dettagli', selected: 'selezionata/e', actions: 'Azioni', apply: 'Applicare', reset: 'Ripristinare', total: 'Totale', unknown: 'Sconosciuto', none: 'Nessuno', ok: 'OK' },
  auth: { login: 'Accedere', logout: 'Disconnettersi', logoutConfirm: 'Vuoi disconnetterti?', email: 'Email', password: 'Password', changePassword: 'Cambiare password', selectRole: 'Selezionare ruolo', demoMode: 'Modalità demo', demoModeDesc: 'Seleziona un profilo per accedere all\'applicazione', smartHotelManagement: 'Gestione Alberghiera Intelligente', poweredBy: 'Powered by FLOWTYM' },
  menu: { myProfile: 'Il mio profilo', darkMode: 'Modalità scura', colorTheme: 'Tema colore', language: 'Lingua', settings: 'Impostazioni', securityPolicy: 'Politica di sicurezza', logout: 'Disconnettersi', team: 'Team', teamManagement: 'Gestione team', teamManagementDesc: "Invitare e gestire i membri dell'hotel", editName: 'Modifica nome', chooseTheme: 'Scegli il tuo tema' },
  settings: { title: 'Impostazioni', pmsConnectivity: 'Connettività PMS', connectionStatus: 'Stato connessione', connected: 'Connesso', connectionError: 'Errore di connessione', syncing: 'Sincronizzazione...', notSynced: 'Non sincronizzato', lastSync: 'Ultima sincronizzazione', records: 'Record', forceSync: 'Forzare sincronizzazione', statistics: 'Statistiche', totalRooms: 'Camere totali', activeReservations: 'Prenotazioni attive', floors: 'Piani', administration: 'Amministrazione', superAdmin: 'Super Admin', superAdminDesc: 'Gestione multi-hotel, abbonamenti, supporto', data: 'Dati', resetAllData: 'Ripristinare tutti i dati', resetConfirm: 'Tutti i dati locali verranno eliminati. Continuare?', resetDone: "Dati ripristinati. Riavviare l'app." },
  roles: { super_admin: 'Super Admin', direction: 'Direzione', reception: 'Ricevimento', gouvernante: 'Governante', femme_de_chambre: 'Cameriera ai piani', maintenance: 'Manutenzione', breakfast: 'Colazione', support: 'Supporto' },
  rooms: { room: 'Camera', rooms: 'Camere', floor: 'Piano', floorN: 'Piano', type: 'Tipo', status: 'Stato', free: 'Libera', occupied: 'Occupata', departure: 'Partenza', stayover: 'Soggiorno', outOfService: 'Fuori servizio', cleaning: 'Pulizia', inProgress: 'In corso', toValidate: 'Da validare', validated: 'Validata', refused: 'Rifiutata', vip: 'VIP', priority: 'Prioritaria', normal: 'Normale', addRoom: 'Nuova camera', roomDetails: 'Dettagli camera', assign: 'Assegnare', assignRooms: 'Assegnare camere', noRoomFound: 'Nessuna camera trovata', allFloors: 'Tutti i piani', roomCount: 'camere', chamberCount: 'cam.', breakfastIncluded: 'Inclusa', breakfastNotIncluded: 'Non inclusa', breakfastCol: 'Colazione', gouvernanteCol: 'Governante', assignmentCol: 'Assegnazione' },
  housekeeping: { title: 'Le mie camere', assignedRooms: 'Camere assegnate', myDay: 'La mia giornata', goodMorning: 'Buongiorno', roomsToday: 'camere oggi', completed: 'completate', startCleaning: 'Iniziare', finishCleaning: 'Finire', npd: 'Non disturbare', blocked: 'Bloccata', checklist: 'Checklist', reportProblem: 'Segnalare problema', lostFound: 'Oggetti smarriti', consumables: 'Materiali di consumo', takePhoto: 'Scattare foto', swipeHint: '👉 Scorri → avvia/termina • ← segnala', allDone: 'Tutto fatto!', noAssigned: 'Nessuna camera assegnata', done: 'Completate', departures: 'Partenze', stayovers: 'Soggiorni', report: 'Segnala', toRedo: 'Da rifare', finished: 'Terminato' },
  gouvernante: { title: 'Governante', supervision: 'Supervisione', validation: 'Validazione', team: 'Team', stocks: 'Scorte', activeMembers: 'membri attivi', todoRooms: 'Camere da pulire', allTodoRooms: 'Tutte le camere da pulire', tasks: 'Compiti', kpis: 'KPIs', toValidate: 'Da validare', toRedo: 'Da rifare', validatedF: 'Validata', assign: 'Assegnare', reassign: 'Riassegnare', validateRooms: 'Validare camere', history: 'Cronologia', fullEconomat: 'Economato completo', economatDesc: 'Scorte, consumi, analisi', lowStockAlert: 'articolo/i con scorta bassa', inventory: 'Inventario', threshold: 'Soglia', noInspectionPending: 'Nessuna ispezione in attesa', noActiveHousekeeper: 'Nessuna cameriera attiva', allStatuses: 'Tutti', statusFilter: 'Stato' },
  reception: { title: 'Ricevimento', dashboard: 'Dashboard', housekeepingDashboard: 'Dashboard', filters: 'Filtri', reports: 'Report', occupiedRooms: 'Occupate', toDo: 'Da fare', urgent: 'Urgenti', delays: 'Ritardi', departuresOfDay: 'Partenze', confirmDeparture: 'Conferma partenza', confirmDepartureMsg: 'Confermare la partenza per', noOccupiedSelected: 'Nessuna camera occupata selezionata.', actionImpossible: 'Azione impossibile', billing: 'Fatturazione', billingAlert: 'Colazione da fatturare' },
  economat: { title: 'Economato', stocks: 'Scorte', consumptions: 'Consumi', analytics: 'Analisi', articles: 'Articoli', lowStock: 'Scorta bassa', todayTotal: 'Oggi', totalCost: 'Totale', restock: 'Rifornire', quantityToAdd: 'Quantità da aggiungere', unitPrice: 'Prezzo unitario (€)', addToStock: 'Aggiungere allo stock', categoryBreakdown: 'Ripartizione per categoria', costPerRoom: 'Costo per camera (Top 10)', criticalStock: 'Stock critico', allStocksOk: 'Tutti gli stock OK', noArticlesFound: 'Nessun articolo trovato', noConsumptions: 'Nessun consumo registrato', dailyReport: 'Rapporto giornaliero', weeklyReport: 'Rapporto settimanale', monthlyReport: 'Rapporto mensile', priceConfig: 'Configurare prezzi', editPrice: 'Modificare prezzo' },
  hotel: { hotelName: "Nome dell'hotel", contactEmail: 'Email di contatto', phone: 'Telefono', address: 'Indirizzo', subscription: 'Abbonamento', subscriptionPlan: 'Piano abbonamento', basic: 'Base', premium: 'Premium', enterprise: 'Enterprise', status: 'Stato', active: 'Attivo', suspended: 'Sospeso', trial: 'Prova', startDate: 'Data inizio', endDate: 'Data fine', createHotel: 'Creare hotel', editHotel: 'Modificare hotel', hotelConfig: 'Configurazione hotel', roomTypes: 'Tipi di camera', roomCategories: 'Categorie', views: 'Vista', bathroomTypes: 'Bagno', equipment: 'Attrezzature', generateRooms: 'Generare camere', importExcel: 'Importare Excel', pmsConfig: 'Configurazione PMS' },
  direction: { title: 'Direzione', occupancyRate: 'Tasso di occupazione', todayRevenue: 'Ricavi del giorno', departures: 'Partenze', arrivals: 'Arrivi', cleanlinessRate: 'Tasso di pulizia', technicalIssues: 'Problemi tecnici', occupation: 'Occupazione', cleanliness: 'Pulizia', todayAlerts: 'Allerte di oggi', urgentInterventions: 'intervento/i urgente/i', roomsToValidate: 'camera/e da validare', pdjToPrepare: 'Colazione da preparare', roomStatuses: 'Stato camere', floorPlan: 'Piano degli ambienti', pdj: 'Colazione', toPrepare: 'Da preparare', served: 'Serviti', paying: 'A pagamento', consumptionsOfDay: 'Consumi del giorno', todayTeam: 'Team di oggi', historyLabel: 'Cronologia', maintenanceTracking: 'Monitoraggio manutenzione', greeting: 'Buongiorno' },
  maintenance: { title: 'Manutenzione', newTicket: 'Nuovo ticket', openTickets: 'Ticket aperti', inProgress: 'In corso', resolved: 'Risolto', priority: 'Priorità', high: 'Alta', medium: 'Media', low: 'Bassa', pending: 'In attesa', noIntervention: 'Nessun intervento', reportedBy: 'Segnalato da', tracking: 'Monitoraggio', allStatuses: 'Tutti gli stati' },
  breakfast: { title: 'Colazione', toPrepare: 'Da preparare', prepared: 'Preparata', delivering: 'In consegna', served: 'Servita', walkIn: 'Walk-in', kitchen: 'Cucina', delivery: 'Consegna', servedTab: 'Serviti', noOrderToPrepare: 'Nessun ordine da preparare', noDeliveryInProgress: 'Nessuna consegna in corso', noHistory: 'Nessuna cronologia', markAs: 'Segna come', confirmMark: 'Conferma', paid: 'A pagamento', persons: 'pers.' },
  superadmin: { dashboard: 'Dashboard', hotels: 'Hotel', users: 'Utenti', support: 'Supporto', logs: 'Log', supportMode: 'Modalità supporto', activateSupport: 'Attivare modalità supporto', exitSupport: 'Uscire dalla modalità supporto' },
  security: { title: 'Politica di sicurezza e privacy', intro: 'FLOWTYM si impegna a proteggere i vostri dati personali in conformità con il GDPR e le leggi applicabili sulla protezione dei dati.', dataCollection: 'Raccolta dati', dataCollectionDesc: 'Raccogliamo solo i dati necessari per il servizio di gestione alberghiera.', purposes: 'Finalità del trattamento', purposesDesc: 'I dati sono utilizzati esclusivamente per la gestione operativa dell\'hotel, la fatturazione e il miglioramento della qualità.', rights: 'Diritti individuali', rightsDesc: 'Ai sensi del GDPR, avete il diritto di accesso, rettifica, cancellazione, portabilità e opposizione.', measures: 'Misure di sicurezza', measuresDesc: 'Implementiamo misure tecniche e organizzative appropriate: crittografia dei dati, controllo degli accessi basato sui ruoli, registrazione delle azioni e audit di sicurezza.', contact: 'Contatto DPO', contactDesc: 'Per domande sulla protezione dei dati, contattate il nostro DPO: dpo@flowtym.com', compliance: 'Conformità', complianceDesc: 'FLOWTYM è conforme al GDPR (UE 2016/679). I dati sono ospitati nell\'Unione Europea.' },
};

const pt: Translations = {
  common: { save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', add: 'Adicionar', search: 'Pesquisar', filter: 'Filtrar', back: 'Voltar', confirm: 'Confirmar', loading: 'Carregando...', error: 'Erro', success: 'Sucesso', noData: 'Sem dados', all: 'Tudo', today: 'Hoje', yesterday: 'Ontem', thisWeek: 'Esta semana', thisMonth: 'Este mês', thisYear: 'Este ano', export: 'Exportar', import: 'Importar', close: 'Fechar', retry: 'Tentar novamente', yes: 'Sim', no: 'Não', seeAll: 'Ver tudo', seeDetails: 'Ver detalhes', selected: 'selecionado(s)', actions: 'Ações', apply: 'Aplicar', reset: 'Reiniciar', total: 'Total', unknown: 'Desconhecido', none: 'Nenhum', ok: 'OK' },
  auth: { login: 'Entrar', logout: 'Sair', logoutConfirm: 'Deseja sair?', email: 'Email', password: 'Senha', changePassword: 'Alterar senha', selectRole: 'Selecionar função', demoMode: 'Modo demo', demoModeDesc: 'Selecione um perfil para aceder à aplicação', smartHotelManagement: 'Gestão Hoteleira Inteligente', poweredBy: 'Powered by FLOWTYM' },
  menu: { myProfile: 'Meu perfil', darkMode: 'Modo escuro', colorTheme: 'Tema de cor', language: 'Idioma', settings: 'Configurações', securityPolicy: 'Política de segurança', logout: 'Sair', team: 'Equipe', teamManagement: 'Gestão da equipe', teamManagementDesc: 'Convidar e gerir membros do hotel', editName: 'Editar nome', chooseTheme: 'Escolha o seu tema' },
  settings: { title: 'Configurações', pmsConnectivity: 'Conectividade PMS', connectionStatus: 'Estado da conexão', connected: 'Conectado', connectionError: 'Erro de conexão', syncing: 'Sincronizando...', notSynced: 'Não sincronizado', lastSync: 'Última sincronização', records: 'Registos', forceSync: 'Forçar sincronização', statistics: 'Estatísticas', totalRooms: 'Total de quartos', activeReservations: 'Reservas ativas', floors: 'Andares', administration: 'Administração', superAdmin: 'Super Admin', superAdminDesc: 'Gestão multi-hotel, subscrições, suporte', data: 'Dados', resetAllData: 'Repor todos os dados', resetConfirm: 'Todos os dados locais serão eliminados. Continuar?', resetDone: 'Dados repostos. Reinicie a aplicação.' },
  roles: { super_admin: 'Super Admin', direction: 'Direção', reception: 'Receção', gouvernante: 'Governanta', femme_de_chambre: 'Empregada de andares', maintenance: 'Manutenção', breakfast: 'Pequeno-almoço', support: 'Suporte' },
  rooms: { room: 'Quarto', rooms: 'Quartos', floor: 'Andar', floorN: 'Andar', type: 'Tipo', status: 'Estado', free: 'Livre', occupied: 'Ocupado', departure: 'Saída', stayover: 'Estadia', outOfService: 'Fora de serviço', cleaning: 'Limpeza', inProgress: 'Em curso', toValidate: 'Para validar', validated: 'Validado', refused: 'Recusado', vip: 'VIP', priority: 'Prioritário', normal: 'Normal', addRoom: 'Novo quarto', roomDetails: 'Detalhes do quarto', assign: 'Atribuir', assignRooms: 'Atribuir quartos', noRoomFound: 'Nenhum quarto encontrado', allFloors: 'Todos os andares', roomCount: 'quartos', chamberCount: 'qt.', breakfastIncluded: 'Incluído', breakfastNotIncluded: 'Não incluído', breakfastCol: 'Peq.-alm.', gouvernanteCol: 'Governanta', assignmentCol: 'Atribuição' },
  housekeeping: { title: 'Meus quartos', assignedRooms: 'Quartos atribuídos', myDay: 'Meu dia', goodMorning: 'Bom dia', roomsToday: 'quartos hoje', completed: 'completados', startCleaning: 'Iniciar', finishCleaning: 'Terminar', npd: 'Não perturbar', blocked: 'Bloqueado', checklist: 'Lista de verificação', reportProblem: 'Reportar problema', lostFound: 'Perdidos e achados', consumables: 'Consumíveis', takePhoto: 'Tirar foto', swipeHint: '👉 Deslizar → iniciar/terminar • ← reportar', allDone: 'Tudo feito!', noAssigned: 'Sem quartos atribuídos', done: 'Concluídos', departures: 'Saídas', stayovers: 'Estadias', report: 'Reportar', toRedo: 'Refazer', finished: 'Terminado' },
  gouvernante: { title: 'Governanta', supervision: 'Supervisão', validation: 'Validação', team: 'Equipa', stocks: 'Stock', activeMembers: 'membros ativos', todoRooms: 'Quartos a limpar', allTodoRooms: 'Todos os quartos a limpar', tasks: 'Tarefas', kpis: 'KPIs', toValidate: 'Para validar', toRedo: 'Refazer', validatedF: 'Validado', assign: 'Atribuir', reassign: 'Reatribuir', validateRooms: 'Validar quartos', history: 'Histórico', fullEconomat: 'Economato completo', economatDesc: 'Stock, consumos, análises', lowStockAlert: 'artigo(s) com stock baixo', inventory: 'Inventário', threshold: 'Limiar', noInspectionPending: 'Sem inspeções pendentes', noActiveHousekeeper: 'Sem empregadas ativas', allStatuses: 'Todos', statusFilter: 'Estado' },
  reception: { title: 'Receção', dashboard: 'Painel', housekeepingDashboard: 'Painel', filters: 'Filtros', reports: 'Relatórios', occupiedRooms: 'Ocupados', toDo: 'A fazer', urgent: 'Urgentes', delays: 'Atrasos', departuresOfDay: 'Saídas', confirmDeparture: 'Confirmar saída', confirmDepartureMsg: 'Confirmar saída para', noOccupiedSelected: 'Nenhum quarto ocupado selecionado.', actionImpossible: 'Ação impossível', billing: 'Faturação', billingAlert: 'Pequeno-almoço a faturar' },
  economat: { title: 'Economato', stocks: 'Stock', consumptions: 'Consumos', analytics: 'Análise', articles: 'Artigos', lowStock: 'Stock baixo', todayTotal: 'Hoje', totalCost: 'Total', restock: 'Reabastecer', quantityToAdd: 'Quantidade a adicionar', unitPrice: 'Preço unitário (€)', addToStock: 'Adicionar ao stock', categoryBreakdown: 'Repartição por categoria', costPerRoom: 'Custo por quarto (Top 10)', criticalStock: 'Stock crítico', allStocksOk: 'Todos os stocks OK', noArticlesFound: 'Nenhum artigo encontrado', noConsumptions: 'Nenhum consumo registado', dailyReport: 'Relatório diário', weeklyReport: 'Relatório semanal', monthlyReport: 'Relatório mensal', priceConfig: 'Configurar preços', editPrice: 'Editar preço' },
  hotel: { hotelName: 'Nome do hotel', contactEmail: 'Email de contacto', phone: 'Telefone', address: 'Morada', subscription: 'Subscrição', subscriptionPlan: 'Plano de subscrição', basic: 'Básico', premium: 'Premium', enterprise: 'Enterprise', status: 'Estado', active: 'Ativo', suspended: 'Suspenso', trial: 'Teste', startDate: 'Data de início', endDate: 'Data de fim', createHotel: 'Criar hotel', editHotel: 'Editar hotel', hotelConfig: 'Configuração do hotel', roomTypes: 'Tipos de quarto', roomCategories: 'Categorias', views: 'Vista', bathroomTypes: 'Casa de banho', equipment: 'Equipamento', generateRooms: 'Gerar quartos', importExcel: 'Importar Excel', pmsConfig: 'Configuração PMS' },
  direction: { title: 'Direção', occupancyRate: 'Taxa de ocupação', todayRevenue: 'Receitas do dia', departures: 'Saídas', arrivals: 'Chegadas', cleanlinessRate: 'Taxa de limpeza', technicalIssues: 'Problemas técnicos', occupation: 'Ocupação', cleanliness: 'Limpeza', todayAlerts: 'Alertas de hoje', urgentInterventions: 'intervenção(ões) urgente(s)', roomsToValidate: 'quarto(s) a validar', pdjToPrepare: 'Pequeno-almoço a preparar', roomStatuses: 'Estado dos quartos', floorPlan: 'Planta dos andares', pdj: 'Peq. almoço', toPrepare: 'A preparar', served: 'Servidos', paying: 'Pagos', consumptionsOfDay: 'Consumos do dia', todayTeam: 'Equipa de hoje', historyLabel: 'Histórico', maintenanceTracking: 'Acomp. manutenção', greeting: 'Bom dia' },
  maintenance: { title: 'Manutenção', newTicket: 'Novo ticket', openTickets: 'Tickets abertos', inProgress: 'Em curso', resolved: 'Resolvido', priority: 'Prioridade', high: 'Alta', medium: 'Média', low: 'Baixa', pending: 'Pendente', noIntervention: 'Sem intervenções', reportedBy: 'Reportado por', tracking: 'Acompanhamento', allStatuses: 'Todos os estados' },
  breakfast: { title: 'Pequeno-almoço', toPrepare: 'A preparar', prepared: 'Preparado', delivering: 'Em entrega', served: 'Servido', walkIn: 'Walk-in', kitchen: 'Cozinha', delivery: 'Entrega', servedTab: 'Servidos', noOrderToPrepare: 'Sem pedidos para preparar', noDeliveryInProgress: 'Sem entregas em curso', noHistory: 'Sem histórico', markAs: 'Marcar como', confirmMark: 'Confirmar', paid: 'Pago', persons: 'pes.' },
  superadmin: { dashboard: 'Painel', hotels: 'Hotéis', users: 'Utilizadores', support: 'Suporte', logs: 'Registos', supportMode: 'Modo suporte', activateSupport: 'Ativar modo suporte', exitSupport: 'Sair do modo suporte' },
  security: { title: 'Política de segurança e privacidade', intro: 'A FLOWTYM compromete-se a proteger os seus dados pessoais de acordo com o RGPD e as leis aplicáveis de proteção de dados.', dataCollection: 'Recolha de dados', dataCollectionDesc: 'Recolhemos apenas os dados necessários para o serviço de gestão hoteleira.', purposes: 'Finalidades do tratamento', purposesDesc: 'Os dados são utilizados exclusivamente para a gestão operacional do hotel, faturação e melhoria da qualidade.', rights: 'Direitos individuais', rightsDesc: 'De acordo com o RGPD, tem o direito de acesso, retificação, eliminação, portabilidade e oposição.', measures: 'Medidas de segurança', measuresDesc: 'Implementamos medidas técnicas e organizativas apropriadas: encriptação de dados, controlo de acesso baseado em funções, registo de ações e auditorias de segurança.', contact: 'Contacto EPD', contactDesc: 'Para questões sobre proteção de dados, contacte o nosso EPD: dpo@flowtym.com', compliance: 'Conformidade', complianceDesc: 'A FLOWTYM está em conformidade com o RGPD (UE 2016/679). Os dados são alojados na União Europeia.' },
};

const ar: Translations = {
  common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', add: 'إضافة', search: 'بحث', filter: 'تصفية', back: 'رجوع', confirm: 'تأكيد', loading: 'جاري التحميل...', error: 'خطأ', success: 'نجاح', noData: 'لا توجد بيانات', all: 'الكل', today: 'اليوم', yesterday: 'أمس', thisWeek: 'هذا الأسبوع', thisMonth: 'هذا الشهر', thisYear: 'هذه السنة', export: 'تصدير', import: 'استيراد', close: 'إغلاق', retry: 'إعادة المحاولة', yes: 'نعم', no: 'لا', seeAll: 'عرض الكل', seeDetails: 'عرض التفاصيل', selected: 'محدد', actions: 'إجراءات', apply: 'تطبيق', reset: 'إعادة تعيين', total: 'المجموع', unknown: 'غير معروف', none: 'لا شيء', ok: 'حسناً' },
  auth: { login: 'تسجيل الدخول', logout: 'تسجيل الخروج', logoutConfirm: 'هل تريد تسجيل الخروج؟', email: 'البريد الإلكتروني', password: 'كلمة المرور', changePassword: 'تغيير كلمة المرور', selectRole: 'اختيار الدور', demoMode: 'وضع تجريبي', demoModeDesc: 'اختر ملفًا شخصيًا للوصول إلى التطبيق', smartHotelManagement: 'إدارة فندقية ذكية', poweredBy: 'مدعوم من FLOWTYM' },
  menu: { myProfile: 'ملفي الشخصي', darkMode: 'الوضع الداكن', colorTheme: 'نمط الألوان', language: 'اللغة', settings: 'الإعدادات', securityPolicy: 'سياسة الأمان', logout: 'تسجيل الخروج', team: 'الفريق', teamManagement: 'إدارة الفريق', teamManagementDesc: 'دعوة وإدارة أعضاء الفندق', editName: 'تعديل الاسم', chooseTheme: 'اختر نمطك' },
  settings: { title: 'الإعدادات', pmsConnectivity: 'اتصال PMS', connectionStatus: 'حالة الاتصال', connected: 'متصل', connectionError: 'خطأ في الاتصال', syncing: 'جاري المزامنة...', notSynced: 'غير متزامن', lastSync: 'آخر مزامنة', records: 'السجلات', forceSync: 'فرض المزامنة', statistics: 'الإحصائيات', totalRooms: 'إجمالي الغرف', activeReservations: 'الحجوزات النشطة', floors: 'الطوابق', administration: 'الإدارة', superAdmin: 'المدير العام', superAdminDesc: 'إدارة الفنادق المتعددة والاشتراكات والدعم', data: 'البيانات', resetAllData: 'إعادة تعيين جميع البيانات', resetConfirm: 'سيتم حذف جميع البيانات المحلية. هل تريد المتابعة؟', resetDone: 'تم إعادة تعيين البيانات. أعد تشغيل التطبيق.' },
  roles: { super_admin: 'المدير العام', direction: 'الإدارة', reception: 'الاستقبال', gouvernante: 'المشرفة', femme_de_chambre: 'عاملة النظافة', maintenance: 'الصيانة', breakfast: 'الإفطار', support: 'الدعم' },
  rooms: { room: 'غرفة', rooms: 'غرف', floor: 'طابق', floorN: 'طابق', type: 'نوع', status: 'الحالة', free: 'متاحة', occupied: 'مشغولة', departure: 'مغادرة', stayover: 'إقامة', outOfService: 'خارج الخدمة', cleaning: 'تنظيف', inProgress: 'قيد التنفيذ', toValidate: 'للتحقق', validated: 'تم التحقق', refused: 'مرفوضة', vip: 'VIP', priority: 'أولوية', normal: 'عادي', addRoom: 'غرفة جديدة', roomDetails: 'تفاصيل الغرفة', assign: 'تعيين', assignRooms: 'تعيين الغرف', noRoomFound: 'لم يتم العثور على غرف', allFloors: 'جميع الطوابق', roomCount: 'غرف', chamberCount: 'غ.', breakfastIncluded: 'مشمول', breakfastNotIncluded: 'غير مشمول', breakfastCol: 'الإفطار', gouvernanteCol: 'المشرفة', assignmentCol: 'التعيين' },
  housekeeping: { title: 'غرفي', assignedRooms: 'الغرف المعينة', myDay: 'يومي', goodMorning: 'صباح الخير', roomsToday: 'غرف اليوم', completed: 'مكتملة', startCleaning: 'بدء', finishCleaning: 'إنهاء', npd: 'عدم الإزعاج', blocked: 'محظورة', checklist: 'قائمة التحقق', reportProblem: 'الإبلاغ عن مشكلة', lostFound: 'المفقودات', consumables: 'المستهلكات', takePhoto: 'التقاط صورة', swipeHint: '👉 اسحب → بدء/إنهاء • ← إبلاغ', allDone: 'تم الانتهاء!', noAssigned: 'لا توجد غرف معينة', done: 'مكتملة', departures: 'مغادرات', stayovers: 'إقامات', report: 'إبلاغ', toRedo: 'إعادة', finished: 'منتهي' },
  gouvernante: { title: 'المشرفة', supervision: 'إشراف', validation: 'التحقق', team: 'الفريق', stocks: 'المخزون', activeMembers: 'أعضاء نشطين', todoRooms: 'غرف للتنظيف', allTodoRooms: 'جميع الغرف للتنظيف', tasks: 'المهام', kpis: 'مؤشرات الأداء', toValidate: 'للتحقق', toRedo: 'إعادة', validatedF: 'تم التحقق', assign: 'تعيين', reassign: 'إعادة التعيين', validateRooms: 'التحقق من الغرف', history: 'السجل', fullEconomat: 'المخزون الكامل', economatDesc: 'المخزون والاستهلاك والتحليل', lowStockAlert: 'عنصر(عناصر) بمخزون منخفض', inventory: 'الجرد', threshold: 'الحد الأدنى', noInspectionPending: 'لا توجد فحوصات معلقة', noActiveHousekeeper: 'لا توجد عاملات نظافة نشطات', allStatuses: 'الكل', statusFilter: 'الحالة' },
  reception: { title: 'الاستقبال', dashboard: 'لوحة التحكم', housekeepingDashboard: 'لوحة التنظيف', filters: 'فلاتر', reports: 'تقارير', occupiedRooms: 'مشغولة', toDo: 'للتنفيذ', urgent: 'عاجلة', delays: 'تأخيرات', departuresOfDay: 'مغادرات', confirmDeparture: 'تأكيد المغادرة', confirmDepartureMsg: 'تأكيد المغادرة لـ', noOccupiedSelected: 'لم يتم تحديد غرف مشغولة.', actionImpossible: 'إجراء مستحيل', billing: 'الفوترة', billingAlert: 'إفطار للفوترة' },
  economat: { title: 'المخزون', stocks: 'المخزون', consumptions: 'الاستهلاك', analytics: 'التحليل', articles: 'المواد', lowStock: 'مخزون منخفض', todayTotal: 'اليوم', totalCost: 'الإجمالي', restock: 'إعادة التخزين', quantityToAdd: 'الكمية المضافة', unitPrice: 'سعر الوحدة (€)', addToStock: 'إضافة للمخزون', categoryBreakdown: 'التوزيع حسب الفئة', costPerRoom: 'التكلفة لكل غرفة (أعلى 10)', criticalStock: 'مخزون حرج', allStocksOk: 'جميع المخزونات جيدة', noArticlesFound: 'لم يتم العثور على مواد', noConsumptions: 'لا يوجد استهلاك مسجل', dailyReport: 'تقرير يومي', weeklyReport: 'تقرير أسبوعي', monthlyReport: 'تقرير شهري', priceConfig: 'تكوين الأسعار', editPrice: 'تعديل السعر' },
  hotel: { hotelName: 'اسم الفندق', contactEmail: 'بريد الاتصال', phone: 'الهاتف', address: 'العنوان', subscription: 'الاشتراك', subscriptionPlan: 'خطة الاشتراك', basic: 'أساسي', premium: 'متميز', enterprise: 'مؤسسي', status: 'الحالة', active: 'نشط', suspended: 'معلق', trial: 'تجريبي', startDate: 'تاريخ البدء', endDate: 'تاريخ الانتهاء', createHotel: 'إنشاء فندق', editHotel: 'تعديل الفندق', hotelConfig: 'إعداد الفندق', roomTypes: 'أنواع الغرف', roomCategories: 'الفئات', views: 'الإطلالة', bathroomTypes: 'الحمام', equipment: 'المعدات', generateRooms: 'إنشاء غرف', importExcel: 'استيراد Excel', pmsConfig: 'إعداد PMS' },
  direction: { title: 'الإدارة', occupancyRate: 'معدل الإشغال', todayRevenue: 'إيرادات اليوم', departures: 'المغادرات', arrivals: 'الوصول', cleanlinessRate: 'معدل النظافة', technicalIssues: 'مشاكل تقنية', occupation: 'الإشغال', cleanliness: 'النظافة', todayAlerts: 'تنبيهات اليوم', urgentInterventions: 'تدخل(ات) عاجل(ة)', roomsToValidate: 'غرفة (غرف) للتحقق', pdjToPrepare: 'إفطار للتحضير', roomStatuses: 'حالة الغرف', floorPlan: 'مخطط الطوابق', pdj: 'الإفطار', toPrepare: 'للتحضير', served: 'مقدم', paying: 'مدفوع', consumptionsOfDay: 'استهلاك اليوم', todayTeam: 'فريق اليوم', historyLabel: 'السجل', maintenanceTracking: 'متابعة الصيانة', greeting: 'صباح الخير' },
  maintenance: { title: 'الصيانة', newTicket: 'تذكرة جديدة', openTickets: 'تذاكر مفتوحة', inProgress: 'قيد التنفيذ', resolved: 'تم الحل', priority: 'الأولوية', high: 'عالية', medium: 'متوسطة', low: 'منخفضة', pending: 'في الانتظار', noIntervention: 'لا توجد تدخلات', reportedBy: 'أبلغ عنه', tracking: 'المتابعة', allStatuses: 'جميع الحالات' },
  breakfast: { title: 'الإفطار', toPrepare: 'للتحضير', prepared: 'جاهز', delivering: 'قيد التوصيل', served: 'تم التقديم', walkIn: 'بدون حجز', kitchen: 'المطبخ', delivery: 'التوصيل', servedTab: 'مقدم', noOrderToPrepare: 'لا توجد طلبات للتحضير', noDeliveryInProgress: 'لا توجد عمليات توصيل', noHistory: 'لا يوجد سجل', markAs: 'وضع علامة كـ', confirmMark: 'تأكيد', paid: 'مدفوع', persons: 'أشخاص' },
  superadmin: { dashboard: 'لوحة التحكم', hotels: 'الفنادق', users: 'المستخدمون', support: 'الدعم', logs: 'السجلات', supportMode: 'وضع الدعم', activateSupport: 'تفعيل وضع الدعم', exitSupport: 'الخروج من وضع الدعم' },
  security: { title: 'سياسة الأمان والخصوصية', intro: 'تلتزم FLOWTYM بحماية بياناتك الشخصية وفقاً للائحة العامة لحماية البيانات (GDPR) وقوانين حماية البيانات المعمول بها.', dataCollection: 'جمع البيانات', dataCollectionDesc: 'نجمع فقط البيانات الضرورية لخدمة إدارة الفنادق.', purposes: 'أغراض المعالجة', purposesDesc: 'تُستخدم البيانات حصرياً للإدارة التشغيلية للفندق والفوترة وتحسين الجودة.', rights: 'حقوق الأفراد', rightsDesc: 'وفقاً للائحة GDPR، لديك حق الوصول والتصحيح والحذف والنقل والاعتراض.', measures: 'إجراءات الأمان', measuresDesc: 'ننفذ إجراءات تقنية وتنظيمية مناسبة: تشفير البيانات، التحكم في الوصول، تسجيل الإجراءات والتدقيق الأمني.', contact: 'الاتصال بمسؤول حماية البيانات', contactDesc: 'للاستفسارات حول حماية البيانات، تواصل مع مسؤول حماية البيانات: dpo@flowtym.com', compliance: 'الامتثال', complianceDesc: 'FLOWTYM متوافق مع GDPR (EU 2016/679). البيانات مستضافة في الاتحاد الأوروبي.' },
};

export const TRANSLATION_MAP: Record<LanguageId, Translations> = {
  fr,
  en,
  de,
  es,
  it,
  pt,
  ar,
};
