import { useEffect, useState } from "react";
import axios from "axios";

export function useDonationForm() {

  const [form, setForm] = useState({
    language: "hi",
    donorName: "",
    address: "",
    mobile: "",
    purposeId: null,
    amount: "",
    gotraId: null,
  });

  const [metadata, setMetadata] = useState({
    purposes: [],
    gotras: [],
  });

  const [ui, setUi] = useState({
    loading: false,
    submitError: null,
    successReceipt: null,
    showGotra: false,
    isAmountFixed: false,
  });

  /* ----------- FETCH METADATA ----------- */
  useEffect(() => {
    axios
      .get("/api/donation/form-metadata")
      .then(res => {
        setMetadata({
          purposes: res.data.purposes || [],
          gotras: res.data.gotras || [],
        });
      })
      .catch(() => {
        setUi(u => ({
          ...u,
          submitError: "Failed to load form metadata",
        }));
      });
  }, []);

  const handlers = {
    setForm,
    setMetadata,
    setUi,
  };

  return {
    form,
    metadata,
    ui,
    handlers,
  };
}
