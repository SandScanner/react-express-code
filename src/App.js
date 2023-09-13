import Logout from "./components/Logout/Logout";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "./Layouts/AdminLayout";
import PrivateRoute from "./utils/PrivateRoute";
import Login from "./components/Login/Login";
import Dashboard from "./components/dashboard/Dashboard";
import { AxiosInterceptor } from "./interceptor/interceptor";
import InfiniteScrollComponent from "./components/ScrollableComponent/InfiniteScrollComponent";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QuarryUpload from "./components/QuarryUploader/QuarryUpload";
import { useEffect } from "react";
import axios from "axios";

function App() {

  const healthcheck = () => {
    axios.get(process.env.REACT_APP_API_URL+"/health").catch(err => console.log('connection failed...'))
  }

  useEffect(() => {
    
    setInterval(healthcheck, 2000);
  }, [])


  return (
    <AxiosInterceptor>
      <div className="App">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={true}
          theme="light"
        />
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route
              path="/"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />

            <Route
              path="/upload"
              element={
                <AdminLayout>
                  <QuarryUpload />
                </AdminLayout>
              }
            />

            <Route
              path="/infiniteScroll"
              element={
                <AdminLayout>
                  <InfiniteScrollComponent />
                </AdminLayout>
              }
            />

            <Route
              path="/logout"
              element={
                <AdminLayout>
                  <Logout />
                </AdminLayout>
              }
            />
          </Route>
          <Route path="/login" Component={Login} />
        </Routes>
      </div>
    </AxiosInterceptor>
  );
}

export default App;
