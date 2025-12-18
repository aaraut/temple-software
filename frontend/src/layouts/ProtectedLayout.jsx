import Header from "../components/Header";

export default function ProtectedLayout({ children }) {
  return (
    <>
      <Header />
      <div style={{ padding: "20px" }}>
        {children}
      </div>
    </>
  );
}
