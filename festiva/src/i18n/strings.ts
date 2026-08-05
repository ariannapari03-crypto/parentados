// Dizionario bilingue IT / EN. L'italiano è la lingua predefinita.

export type Lang = 'it' | 'en'

export const strings = {
  it: {
    appName: 'FESTIVA',
    tagline: 'Il tuo planner di feste',
    loading: 'Caricamento…',

    // Auth
    signIn: 'Accedi',
    signUp: 'Registrati',
    email: 'Email',
    password: 'Password',
    displayName: 'Come ti chiami',
    createAccount: 'Crea account',
    haveAccount: 'Hai già un account?',
    noAccount: 'Non hai un account?',
    signOut: 'Esci',
    iAmOrganizer: 'Organizzo eventi',
    iAmOrganizerHint: 'Feste, inviti, budget e prenotazioni',
    iAmPartner: 'Sono un locale',
    iAmPartnerHint: 'Pubblico la mia scheda e le promozioni',
    chooseRole: 'Chi sei?',
    checkEmail: 'Ti abbiamo inviato una email di conferma. Controlla la posta per attivare l’account.',
    authError: 'Controlla email e password e riprova.',

    // Nav — organizer
    navHome: 'Home',
    navCreate: 'Crea',
    navPromo: 'Promo',
    navVendors: 'Locali',
    navGuests: 'Invitati',

    // Nav — partner
    navDashboard: 'Dashboard',
    navRedemptions: 'Riscatti',
    navProfileCard: 'Scheda',

    // Placeholder generico
    comingSoon: 'In arrivo',
    comingSoonBody: 'Questa sezione arriva nelle prossime fasi. Le fondamenta ci sono già.',

    // Home organizer (empty state)
    yourEvents: 'I tuoi eventi',
    noEventsTitle: 'Ancora nessun evento',
    noEventsBody: 'Crea il tuo primo evento e inizia a organizzare la festa perfetta.',
    newEvent: 'Nuovo evento',

    // Partner dashboard
    partnerHi: 'Ciao',
    trialActive: 'Prova gratuita attiva',
    trialBody: 'Stai provando FESTIVA gratis. Pubblica la tua scheda e le promozioni quando vuoi.',
  },
  en: {
    appName: 'FESTIVA',
    tagline: 'Your party planner',
    loading: 'Loading…',

    signIn: 'Sign in',
    signUp: 'Sign up',
    email: 'Email',
    password: 'Password',
    displayName: 'Your name',
    createAccount: 'Create account',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    signOut: 'Sign out',
    iAmOrganizer: 'I plan events',
    iAmOrganizerHint: 'Parties, invites, budget and bookings',
    iAmPartner: 'I run a venue',
    iAmPartnerHint: 'I publish my listing and promotions',
    chooseRole: 'Who are you?',
    checkEmail: 'We sent you a confirmation email. Check your inbox to activate your account.',
    authError: 'Check your email and password and try again.',

    navHome: 'Home',
    navCreate: 'Create',
    navPromo: 'Deals',
    navVendors: 'Vendors',
    navGuests: 'Guests',

    navDashboard: 'Dashboard',
    navRedemptions: 'Redemptions',
    navProfileCard: 'Listing',

    comingSoon: 'Coming soon',
    comingSoonBody: 'This section arrives in the next phases. The foundations are already here.',

    yourEvents: 'Your events',
    noEventsTitle: 'No events yet',
    noEventsBody: 'Create your first event and start planning the perfect party.',
    newEvent: 'New event',

    partnerHi: 'Hi',
    trialActive: 'Free trial active',
    trialBody: "You're trying FESTIVA for free. Publish your listing and promotions whenever you like.",
  },
} as const

export type StringKey = keyof (typeof strings)['it']
