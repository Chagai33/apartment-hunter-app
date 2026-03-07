export type ApartmentStatus = 'new' | 'called' | 'visited' | 'rejected';

export interface CustomChecklistTemplate {
    id: string;
    label: string;
    phase: 'scouting' | 'phone' | 'visit' | 'signing';
}

export type RequirementState = 'required' | 'excluded' | null;

export interface UserPreferences {
    minRooms?: number;
    maxPrice?: number;
    minPrice?: number;
    area?: string[];

    // Mandatory requirements (Must Haves / Dealbreakers)
    mustHaveElevator?: boolean;
    mustHaveParking?: boolean;
    mustHaveBalcony?: boolean;
    mustHavePets?: boolean;
    mustHaveAC?: boolean;
    mustHaveMamad?: boolean; // Safe room
    mustHaveTama38?: boolean;
    mustHaveFurnished?: boolean;

    // Custom Must Haves (Legacy array of IDs that are 'required')
    customMustHaves?: string[];
}

export interface User {
    uid: string;
    role?: 'agent' | 'client';
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    groupId?: string;
    preferences?: UserPreferences;

    // New features
    checklistTemplates?: CustomChecklistTemplate[];
    savedProfiles?: { id: string; name: string; preferences: UserPreferences }[];
}

export interface Apartment {
    id: string;
    userId: string; // Owner
    groupId: string; // The group this belongs to

    // Core Info
    address: string;
    city: string;
    neighborhood: string;
    price: number;
    rooms?: number;
    floor?: number;
    size?: number; // sq meters
    link?: string;

    // Status
    status: ApartmentStatus;

    // Dates
    createdAt: any; // Firestore Timestamp
    updatedAt: any;

    // Tracking
    createdBy: string;
    createdByName?: string;
    lastUpdatedBy?: string;
    lastUpdatedByName?: string;

    // Contact
    contactName?: string;
    contactPhone?: string;
    ownerName?: string;
    ownerPhone?: string;
    additionalContactName?: string;
    additionalPhone?: string;

    // Features / Boolean Checks
    elevator?: boolean;
    parking?: boolean;
    balcony?: boolean;
    ac?: boolean;
    mamad?: boolean;
    warehouse?: boolean;
    access?: boolean; // Accessibility
    pets?: boolean;
    furnished?: boolean;
    roommates?: boolean;
    immediate?: boolean;
    longTerm?: boolean;

    // Condition
    renovated?: boolean;
    bars?: boolean; // Soragim
    waterPressure?: boolean;
    noiseLevel?: boolean; // Quiet?
    naturalLight?: boolean;
    doubleGlazed?: boolean;
    moldCheck?: boolean; // No mold
    mobileReception?: boolean;

    // Commercial
    brokerFee?: boolean;
    arnona?: number;
    vaad?: number;

    // Media
    images: { url: string; path: string }[];

    notes?: string;
    checklistNotes?: Record<string, string>; // key: fieldName, value: note
    customChecks?: Record<string, boolean>; // key: templateId, value: checked

    // Phases State (optional, can be derived)
    phase?: 'scouting' | 'phone' | 'visit' | 'signing';

    // Specific fields from old interface that were missing
    tama38?: boolean;

    // Soft Delete
    deleted?: boolean;
    deletedAt?: any;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    preferences?: UserPreferences;
    groupId?: string;
}

export type GroupMemberRole = 'owner' | 'editor' | 'viewer';

export interface GroupMembership {
    groupId: string;
    groupName: string;
    role: GroupMemberRole;
    joinedAt: any;
}

export interface Group {
    id: string;
    name: string;
    createdBy: string;
    members: string[]; // array of userIds
    createdAt: number;
    preferences?: UserPreferences;
    checklistTemplates?: CustomChecklistTemplate[];
}
