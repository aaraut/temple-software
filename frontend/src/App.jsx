import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import GotraList from "./pages/GotraList";
import HomeRedirect from "./pages/HomeRedirect";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import ProtectedLayout from "./layouts/ProtectedLayout";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import UserList from "./pages/UserList";
import DonationCreatePage from "./pages/donation/DonationCreatePage";
import Daan from "./pages/donation/Daan";
import InventoryPage from "./pages/inventory/InventoryPage";
import RentalIssuePage from "./pages/rental/RentalIssuePage";
import RentalReturnPage from "./pages/rental/RentalReturnPage";
import MyRentalSummaryPage from "./pages/reports/MyRentalSummaryPage";
import PendingRentalReportPage from "./pages/reports/PendingRentalReportPage";
import AdminRentalSummaryPage from "./pages/reports/AdminRentalSummaryPage";
import MyRentalEntriesPage from "./pages/reports/MyRentalEntriesPage";
import RentalDetailPage from "./pages/rental/RentalDetailPage";
import "./styles/print.css";
import RoomPage from "./pages/room/RoomInventoryPage";
import RoomBookingPage from "./pages/room/RoomBookingPage";
import BhaktNiwasPage from "./pages/bhaktniwas/BhaktNiwasPage";
import DonationPurposePage from "./pages/master/DonationPurposePage";
// import RoomPage from "./components/room/RoomPage";



function App() {
  const { auth } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <HomeRedirect />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />



        <Route
          path="/gotra"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <GotraList />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes (future) */}
        
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <ChangePassword />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
              <ProtectedLayout>
                <UserList />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/donation"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <DonationCreatePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals/bartan"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RentalIssuePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bhakt-niwas"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <BhaktNiwasPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/rentals/bichayat"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RentalIssuePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/rooms"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RoomPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms/bookings"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RoomBookingPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

            


        <Route
          path="/inventory/bartan"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/bichayat"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rentals/return"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RentalReturnPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/rentals/my"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <MyRentalSummaryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/rentals/pending"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <PendingRentalReportPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/rentals/admin"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
              <ProtectedLayout>
                <AdminRentalSummaryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/rentals/my-entries"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <MyRentalEntriesPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals/view/:receiptNumber"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <RentalDetailPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/donation-purpose"
          element={
            <ProtectedLayout roles={["ADMIN", "SUPER_ADMIN"]}>
              <DonationPurposePage />
            </ProtectedLayout>
          }
        />






        {/* <Route
          path="/donation/daan"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Daan />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        /> */}


      </Routes>
    </BrowserRouter>
  );
}

export default App;
