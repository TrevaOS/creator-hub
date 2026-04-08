import { createContext, useContext, useReducer } from 'react';

const ProfileContext = createContext(null);

const initialState = {
  socialAccounts: [],
  dashboardModules: null,
  carouselImages: [],
  collabBrands: [],
  loading: false,
};

function profileReducer(state, action) {
  switch (action.type) {
    case 'SET_SOCIAL_ACCOUNTS':
      return { ...state, socialAccounts: action.payload };
    case 'SET_DASHBOARD_MODULES':
      return { ...state, dashboardModules: action.payload };
    case 'SET_CAROUSEL_IMAGES':
      return { ...state, carouselImages: action.payload };
    case 'SET_COLLAB_BRANDS':
      return { ...state, collabBrands: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_MODULE':
      return { ...state, dashboardModules: { ...state.dashboardModules, ...action.payload } };
    default:
      return state;
  }
}

export function ProfileProvider({ children }) {
  const [state, dispatch] = useReducer(profileReducer, initialState);

  return (
    <ProfileContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
