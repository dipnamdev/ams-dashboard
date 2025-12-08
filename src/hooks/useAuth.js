import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth';

// export const useAuth = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let isMounted = true;

//     const loadUser = async () => {
//       try {
//         const currentUser = await getCurrentUser();
//         if (isMounted) {
//           setUser(currentUser);
//         }
//       } catch (error) {
//         console.error('Error loading user:', error);
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     const handleAuthChanged = (event) => {
//       setUser(event.detail || null);
//       setLoading(false);
//     };

//     loadUser();
//     if (typeof window !== 'undefined') {
//       window.addEventListener('auth-changed', handleAuthChanged);
//     }

//     return () => {
//       isMounted = false;
//       if (typeof window !== 'undefined') {
//         window.removeEventListener('auth-changed', handleAuthChanged);
//       }
//     };
//   }, []);

//   return { user, loading, setUser };
// };
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const handleAuthChanged = (event) => {
      // TRUST THE LOGIN EVENT
      setUser(event.detail || null);
      setLoading(false);
    };

    // Listen for login/logout
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-changed', handleAuthChanged);
    }

    // Load user from storage only if no event fired
    loadUser();

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-changed', handleAuthChanged);
      }
    };
  }, []);

  return { user, loading };
};
