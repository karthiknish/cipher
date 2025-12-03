import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-[0.3em] mb-6 block">
              CIPHER
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Premium streetwear engineered for the modern urban explorer. Designed in LA.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs tracking-[0.2em] text-white/50 mb-6">SHOP</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop" className="text-white/70 hover:text-white transition">All Products</Link></li>
              <li><Link href="/shop?category=Hoodies" className="text-white/70 hover:text-white transition">Hoodies</Link></li>
              <li><Link href="/shop?category=Tees" className="text-white/70 hover:text-white transition">Tees</Link></li>
              <li><Link href="/shop?category=Outerwear" className="text-white/70 hover:text-white transition">Outerwear</Link></li>
              <li><Link href="/shop?category=Accessories" className="text-white/70 hover:text-white transition">Accessories</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs tracking-[0.2em] text-white/50 mb-6">COMMUNITY</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/blog" className="text-white/70 hover:text-white transition">Blog</Link></li>
              <li><Link href="/challenges" className="text-white/70 hover:text-white transition">Challenges</Link></li>
              <li><Link href="/creators" className="text-white/70 hover:text-white transition">Creators</Link></li>
              <li><Link href="/vote" className="text-white/70 hover:text-white transition">Vote</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] text-white/50 mb-6">HELP</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="text-white/70 hover:text-white transition">Contact Us</Link></li>
              <li><Link href="/size-guide" className="text-white/70 hover:text-white transition">Size Guide</Link></li>
              <li><Link href="/faqs" className="text-white/70 hover:text-white transition">FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs tracking-[0.2em] text-white/50 mb-6">LEGAL</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-white/70 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/70 hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Cipher. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-white transition">Instagram</Link>
              <Link href="#" className="hover:text-white transition">Twitter</Link>
              <Link href="#" className="hover:text-white transition">TikTok</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
