export default function Footer() {
  return (
    <footer className="border-t border-white/7 px-12 py-8 flex flex-col md:flex-row items-center justify-center gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center text-[10px] font-black text-white">
          SF
        </div>
        <span className="text-sm text-[#6b6b80]">© 2026 SprintFlow. Built for builders.</span>
      </div>
    </footer>
  );
}
