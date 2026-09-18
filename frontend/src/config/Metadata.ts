/**
 * Metadata configuration for IARTY
 * Optimized for SEO, OpenGraph, Twitter cards, and other essential meta information
 * Updated to include Products and Services
 */
const MetadataConfig = {
    // Basic metadata
    title: "IARTY | Official Website - Tech Education, Products & Digital Services",
    creator: "IARTY",
    metadataBase: new URL("https://www.iarty.id"),
    description:
        "Official website of IARTY. A digital ecosystem providing IT education, innovative products, and professional digital services for students, beginners, and businesses.",

    // Keywords for SEO (Expanded for Products & Services)
    keywords: [
        // Branding
        "iarty",
        "iarty education",
        "iarty products",
        "iarty services",
        "iarty indonesia",

        // Services (Layanan)
        "software development services",
        "jasa pembuatan website",
        "jasa pembuatan aplikasi",
        "ui ux design services",
        "digital transformation consultant",
        "it consulting indonesia",

        // Products (Produk)
        "digital products",
        "software solutions",
        "educational tools",
        "sass products iarty",

        // Education (Existing)
        "online education",
        "coding bootcamp indonesia",
        "belajar programming",
        "web development course",
        "react nextjs tutorial",
    ],

    // Author information
    authors: {
        name: "IARTY Team",
        url: "https://www.iarty.id",
    },

    // OpenGraph metadata for social media sharing
    openGraph: {
        type: "website",
        url: "https://www.iarty.id",
        siteName: "IARTY",
        title: "IARTY - Innovating Education, Products, and Digital Services",
        description:
            "Solusi satu atap untuk belajar coding, membangun produk digital, dan layanan pengembangan software profesional.",
        locale: "id-ID",
        images: [
            {
                url: "/og-image.jpg", // Pastikan gambar ini merepresentasikan brand secara umum
                width: 1200,
                height: 630,
                alt: "IARTY - Tech Ecosystem",
                type: "image/jpeg",
            },
        ],
        countryName: "Indonesia",
        emails: ["contact@iarty.id"],
    },

    // Twitter card metadata
    twitter: {
        card: "summary_large_image",
        title: "IARTY - Tech Education, Products & Services",
        description:
            "Dari kursus coding hingga solusi perangkat lunak kustom. Bangun masa depan digital Anda bersama IARTY.",
        creator: "@iarty",
        images: ["/og-image.jpg"],
    },

    // Search engine crawler settings
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },

    // Favicon and icon configurations
    icons: {
        icon: [
            { url: "/favicon.ico" },
        ],
        shortcut: "/favicon.ico",
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },

    // Canonical URL
    alternates: {
        canonical: "https://www.iarty.id",
    },

    // Website category
    category: "technology",
};

export default MetadataConfig;