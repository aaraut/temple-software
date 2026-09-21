import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
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
import RoomCategoryPage from "./pages/room/RoomCategoryPage";
import RoomBookingPage from "./pages/room/RoomBookingPage";
import BhaktNiwasPage from "./pages/bhaktniwas/BhaktNiwasPage";
import RoomGridPage from "./pages/bhaktniwas/RoomGridPage";
import BookingSearchPage from "./pages/bhaktniwas/BookingSearchPage";
import DonationPurposePage from "./pages/master/DonationPurposePage";
import CollectionDashboard from "./pages/dashboard/CollectionDashboard";
import DonationDetails from "./pages/reports/DonationDetails";
import DonationEdit from "./pages/donation/DonationEdit";
import DonationSearch from "./pages/donation/DonationSearch";
import UpiDonationForm from "./pages/donation/UpiDonationForm";
import ModuleAccessSettings from "./pages/settings/ModuleAccessSettings";
import { MODULE_KEYS } from "./constants/modules";
import MobileBlocked from "./pages/MobileBlocked";
import { isMobileDevice } from "./utils/deviceDetect";
// import RoomPage from "./components/room/RoomPage";



function App() {
  const { auth } = useAuth();

  const theme = createTheme({
    typography: {
      htmlFontSize: 24,   // actual html font-size: 150% of 16px = 24px
      fontSize: 16,       // base font size for MUI to scale from
    },
  });

  if (isMobileDevice()) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MobileBlocked />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
            <ProtectedRoute moduleKey={MODULE_KEYS.MASTER}>
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
            <ProtectedRoute moduleKey={MODULE_KEYS.DAAN}>
              <ProtectedLayout>
                <DonationCreatePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals/bartan"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BICHAYAT}>
              <ProtectedLayout>
                <RentalIssuePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bhakt-niwas"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <BhaktNiwasPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bhakt-niwas/:blockId"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <RoomGridPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bhakt-niwas-search"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <BookingSearchPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/rentals/bichayat"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BICHAYAT}>
              <ProtectedLayout>
                <RentalIssuePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/rooms"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <RoomPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/room-categories"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <RoomCategoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms/bookings"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BHAKT_NIWAS}>
              <ProtectedLayout>
                <RoomBookingPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />




        <Route
          path="/inventory/bartan"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.MASTER}>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/bichayat"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.MASTER}>
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rentals/return"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BICHAYAT}>
              <ProtectedLayout>
                <RentalReturnPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/rentals/my"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.REPORTS}>
              <ProtectedLayout>
                <MyRentalSummaryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/rentals/pending"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.REPORTS}>
              <ProtectedLayout>
                <PendingRentalReportPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/rentals/admin"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]} moduleKey={MODULE_KEYS.REPORTS}>
              <ProtectedLayout>
                <AdminRentalSummaryPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/rentals/my-entries"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.REPORTS}>
              <ProtectedLayout>
                <MyRentalEntriesPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals/view/:receiptNumber"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.BICHAYAT}>
              <ProtectedLayout>
                <RentalDetailPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/donation-purpose"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]} moduleKey={MODULE_KEYS.MASTER}>
              <ProtectedLayout>
                <DonationPurposePage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/module-access"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
              <ProtectedLayout>
                <ModuleAccessSettings />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <CollectionDashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/details"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.REPORTS}>
              <ProtectedLayout>
                <DonationDetails />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation/edit/:id"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.DAAN}>
              <ProtectedLayout>
                <DonationEdit />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="donation/search"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.DAAN}>
              <ProtectedLayout>
                <DonationSearch  />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation/upi"
          element={
            <ProtectedRoute moduleKey={MODULE_KEYS.DAAN}>
              <ProtectedLayout>
                <UpiDonationForm />
              </ProtectedLayout>
            </ProtectedRoute>
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
    </ThemeProvider>
  );
}

export default App;
