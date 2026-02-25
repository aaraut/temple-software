import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  IconButton
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Header() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [donationAnchor, setDonationAnchor] = useState(null);
  const [inventoryAnchor, setInventoryAnchor] = useState(null);
  const [rentalAnchor, setRentalAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [reportAnchor, setReportAnchor] = useState(null);
  const [roomAnchor, setRoomAnchor] = useState(null);
  const openRoom = Boolean(roomAnchor);
  const openReport = Boolean(reportAnchor);


  if (!auth) return null;

  const isAdmin =
    auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  /* ---------- Donation Menu ---------- */
  const openDonation = Boolean(donationAnchor);
  const handleDonationOpen = (event) => {
    setDonationAnchor(event.currentTarget);
  };
  const handleDonationClose = () => {
    setDonationAnchor(null);
  };

  /* ---------- Inventory Menu ---------- */
  const openInventory = Boolean(inventoryAnchor);
  const handleInventoryOpen = (event) => {
    setInventoryAnchor(event.currentTarget);
  };
  const handleInventoryClose = () => {
    setInventoryAnchor(null);
  };

  /* ---------- Rental Menu ---------- */
  const openRental = Boolean(rentalAnchor);
  const handleRentalOpen = (event) => {
    setRentalAnchor(event.currentTarget);
  };
  const handleRentalClose = () => {
    setRentalAnchor(null);
  };

  /* ---------- Profile Menu ---------- */
  const openProfile = Boolean(profileAnchor);
  const handleProfileOpen = (event) => {
    setProfileAnchor(event.currentTarget);
  };
  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  /****************Reports */
  const handleReportOpen = (event) => {
  setReportAnchor(event.currentTarget);
  };
  const handleReportClose = () => {
    setReportAnchor(null);
  };

  

const handleRoomOpen = (event) => {
  setRoomAnchor(event.currentTarget);
};

const handleRoomClose = () => {
  setRoomAnchor(null);
};


  return (
    <AppBar position="static" sx={{ backgroundColor: "#7a1f1f" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

        {/* Logo */}
        <Typography
          variant="h6"
          sx={{ cursor: "pointer", fontWeight: 600 }}
          onClick={() => navigate("/")}
        >
          🛕 Chamatkarik Shree Hanuman Mandir Jamsawli
        </Typography>

        {/* Main Menu */}
        <Box sx={{ display: "flex", gap: 2 }}>

          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>

          

          <Button color="inherit" onClick={() => navigate("/donation")}>
            Donation
          </Button>

          {/* 🔹 Inventory Dropdown */}
          <Button
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleInventoryOpen}
          >
            Master
          </Button>

          <Menu
            anchorEl={inventoryAnchor}
            open={openInventory}
            onClose={handleInventoryClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem
              onClick={() => {
                handleInventoryClose();
                navigate("/inventory/bartan");
              }}
            >
              Bartan
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleInventoryClose();
                navigate("/inventory/bichayat");
              }}
            >
              Bichayat
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleInventoryClose();
                navigate("/gotra");
              }}
            >
              Gotra
            </MenuItem>
            {isAdmin && (
            <MenuItem
              onClick={() => {
                handleInventoryClose();
                navigate("/master/donation-purpose");
              }}
            >
              Donation Purpose
            </MenuItem>
          )}
          </Menu>
          

          {/* 🔹 Rental Dropdown (NEW) */}
          <Button
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleRentalOpen}
          >
            Rental
          </Button>

          <Menu
            anchorEl={rentalAnchor}
            open={openRental}
            onClose={handleRentalClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem
              onClick={() => {
                handleRentalClose();
                navigate("/rentals/bartan");
              }}
            >
              Bartan
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleRentalClose();
                navigate("/rentals/bichayat");
              }}
            >
              Bichayat
            </MenuItem>
          </Menu>
          <MenuItem onClick={() => navigate("/rentals/return")}>
            Return Rental
          </MenuItem>
          
          <Button
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleReportOpen}
          >
            Reports
          </Button>

          <Menu
            anchorEl={reportAnchor}
            open={openReport}
            onClose={handleReportClose}
          >
            <MenuItem
              onClick={() => {
                handleReportClose();
                navigate("/reports/rentals/my-entries");
              }}
            >
              My Rental Entries
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleReportClose();
                navigate("/reports/rentals/my");
              }}
            >
              My Rental Summary
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleReportClose();
                navigate("/reports/rentals/pending");
              }}
            >
              Pending Rentals
            </MenuItem>

            {isAdmin && (
              <MenuItem
                onClick={() => {
                  handleReportClose();
                  navigate("/reports/rentals/admin");
                }}
              >
                Rental Admin Summary
              </MenuItem>
            )}
          </Menu>
          {/* 🔹 Bhakt Niwas Dropdown */}
          <Button
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleRoomOpen}
          >
            Bhakt Niwas
          </Button>

          <Menu
            anchorEl={roomAnchor}
            open={openRoom}
            onClose={handleRoomClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem
              onClick={() => {
                handleRoomClose();
                navigate("/bhakt-niwas");
              }}
            >
              Bhakt Niwas Dashboard
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleRoomClose();
                navigate("/inventory/rooms");
              }}
            >
              Room Inventory
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleRoomClose();
                navigate("/rooms/bookings");
              }}
            >
              Room Booking
            </MenuItem>
          </Menu>



          {/* Donation Dropdown (REFERENCE – COMMENTED) */}
          {/*
          <Button
            color="inherit"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleDonationOpen}
          >
            Donation
          </Button>

          <Menu
            anchorEl={donationAnchor}
            open={openDonation}
            onClose={handleDonationClose}
          >
            <MenuItem
              onClick={() => {
                handleDonationClose();
                navigate("/donation/abhishek");
              }}
            >
              Abhishek
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDonationClose();
                navigate("/donation/daan");
              }}
            >
              Daan
            </MenuItem>
          </Menu>
          */}

          {isAdmin && (
            <Button color="inherit" onClick={() => navigate("/users")}>
              Users
            </Button>
          )}
        </Box>

        {/* Profile Menu */}
        <Box>
          <IconButton color="inherit" onClick={handleProfileOpen}>
            <AccountCircle />
            <Typography sx={{ ml: 1 }}>
              {auth.username}
            </Typography>
            <ArrowDropDownIcon />
          </IconButton>

          <Menu
            anchorEl={profileAnchor}
            open={openProfile}
            onClose={handleProfileClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                handleProfileClose();
                navigate("/change-password");
              }}
            >
              Change Password
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleProfileClose();
                logout();
              }}
              sx={{ color: "#7a1f1f", fontWeight: 500 }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>

      </Toolbar>
    </AppBar>
  );
}
