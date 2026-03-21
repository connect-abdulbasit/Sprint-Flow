export default function Footer() {
  return (
    <footer className="border-t border-white/7 px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4f7cff] to-[#a259ff] flex items-center justify-center text-[10px] font-black text-white">
          SF
        </div>
        <span className="text-sm text-[#6b6b80]">© 2025 SprintFlow. Built for builders.</span>
      </div>
      <ul className="flex items-center gap-6 list-none">
        {["Privacy", "Terms", "GitHub", "Contact"].map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-sm text-[#6b6b80] hover:text-[#f0f0f5] transition-colors duration-200 no-underline"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
