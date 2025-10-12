export default function DesignBoardEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout provides a full-screen experience without the sidebar
  // for the collaborative whiteboard editor
  return <>{children}</>;
}
