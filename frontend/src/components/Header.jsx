import { AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, IconButton } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Header() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [donationAnchor, setDonationAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [inventoryAnchor, setInventoryAnchor] = useState(null);


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

  /* ---------- Profile Menu ---------- */
  const openProfile = Boolean(profileAnchor);
  const handleProfileOpen = (event) => {
    setProfileAnchor(event.currentTarget);
  };
  const handleProfileClose = () => {
    setProfileAnchor(null);
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

          <Button color="inherit" onClick={() => navigate("/gotra")}>
            Gotra
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
            Inventory
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
          </Menu>

          {/* Donation Dropdown */}
          {/* <Button
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
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
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
          </Menu> */}

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
