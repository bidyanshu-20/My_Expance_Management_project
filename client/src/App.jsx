import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import { useEffect, useState } from "react"
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import Expense from "./pages/Expense"
import Income from "./pages/income"
import Profile from "./pages/Profile"
const API_URL = "http://localhost:4000";
// to get transactions from localStorage
const getTransactionsFromStorage = () => {
  const saved = localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : [];
}

// to protect the routes

const ProtectedRoute = ({ user, children }) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  const storedToken = localToken || sessionToken || null;
  const hasToken = localToken || sessionToken;
  if (!user || !hasToken) {
    return <Navigate to="/login" replace />
  }
  return children;
}
// const location = useLocation();
// useEffect(()=>{
//   window.scrollTo({top:0,left:0,behavior:"auto"});
// },[location.pathname]);

const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  return null;
};


const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const clearAuth = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
    catch (error) {
      console.log("CLEAR AUTH ERROR ", error);
    }
    setUser(null);
    setToken(null);
  }
  const persistAuth = (userObj, tokenStr, remember = false) => {
    try {
      if (remember) {
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) localStorage.setItem("token", tokenStr);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        if (userObj) sessionStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) sessionStorage.setItem("token", tokenStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };
  // to update user data both in state and storage

  const updateUserData = (updateuser) => {
    setUser(updateuser);
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const storedToken = localToken || sessionToken || null;
    if (localToken) {
      localStorage.setItem("user", JSON.stringify(updateuser));
    }
    else if (sessionToken) {
      sessionStorage.setItem("user", JSON.stringify(updateuser))
    }
  }
  // try ro load user with token when mounted
  useEffect(() => {
    (async () => {
      try {
        const localUserRow = localStorage.getItem("user");
        const sessionUserRow = sessionStorage.getItem("user");
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        const storeUser = localUserRow ? JSON.parse(localUserRow) : sessionUserRow ? JSON.parse(sessionUserRow) : null;

        const storedToken = localToken || sessionToken || null;
        const tokenFromLocal = !!localToken;
        if (storedToken) {
          setUser(storeUser);
          setToken(storedToken);
          setIsLoading(false);
          return;
        }

        if (storedToken) {
          try {
            const res = await axios.get("api/user/me", {
              headers: { Authorization: `Bearer ${storedToken}` }
            })
            const profile = res.data;
            persistAuth(profile, storedToken, tokenFromLocal);

          }
          catch (fetchErr) {
            console.warn("Could not fetch profile with the stored token", fetchErr);
            clearAuth();
          }
        }
      } catch (error) {
        console.error("error bootstrapping auth", error);
      } finally {
        setIsLoading(false);
        try {
          setTransactions(getTransactionsFromStorage())
        } catch (error) {
          console.log("Error loading transactions ", error);
        }
      }
    })();
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));

    } catch (error) {
      console.error("Err saving transations ", error);
    }
  }, [transactions]);

  const addTransaction = (newTransaction) =>
    setTransactions((p) => [newTransaction, ...p]);
  const editTransaction = (id, updatedTransaction) =>
    setTransactions((p) =>
      p.map((t) => (t.id === id ? { ...updatedTransaction, id } : t)),
    );
  const deleteTransaction = (id) =>
    setTransactions((p) => p.filter((t) => t.id !== id));
  const refreshTransactions = () =>
    setTransactions(getTransactionsFromStorage());


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  }

  const handleLogin = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/")
  }

  const handleSignup = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/")
  }




  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignUp onSignup={handleSignup} />} />
        <Route element={<ProtectedRoute user={user}><Layout user={user}
          onLogout={handleLogout}
          transactions={transactions}
          addTransaction={addTransaction}
          editTransaction={editTransaction} deleteTransaction={deleteTransaction} refreshTransactions={refreshTransactions}
        />
        </ProtectedRoute>}>

          {/* </Route> */}
          {/* <Route element={<Layout user={user} onLogout={handleLogout} />}> */}
          {/* <Route path="/" element={<Dashboard />} /> */}
          {/* </Route> */}
          <Route
            path="/"
            element={
              <Dashboard
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />
          <Route path="/income" element={
            <Income
              transactions={transactions}
              addTransaction={addTransaction}
              editTransaction={editTransaction}
              deleteTransaction={deleteTransaction}
              refreshTransactions={refreshTransactions} />} />

          <Route path="/expense"
            element={
              <Expense
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions} />
            }
          />
          <Route path="/profile" element={<Profile user={user} onUpdateProfile={updateUserData} onLogout={handleLogout} />}
          />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </>
  )
}

export default App