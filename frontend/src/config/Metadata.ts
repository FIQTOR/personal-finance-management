/**
 * Metadata configuration for Personal Finance Management.
 * Optimized for SEO, OpenGraph, Twitter cards, and other essential meta information.
 */

const MetadataConfig = {
    // Basic metadata
    title: "Personal Finance | Track Income, Expenses & Budgets",
    creator: "Personal Finance Management",
    metadataBase: new URL("https://www.iarty.id"),
    description:
        "A comprehensive personal finance management solution to track income and expenses, monitor category budgets, manage savings goals, and export reports.",

    // Keywords for SEO
    keywords: [
        "personal finance",
        "budgeting",
        "expense tracker",
        "income tracking",
        "financial goals",
        "money management",
        "savings",
    ],

    // Author information
    authors: {
        name: "Personal Finance Management",
        url: "https://www.iarty.id",
    },

    // OpenGraph metadata for social media sharing
    openGraph: {
        type: "website",
        url: "https://www.iarty.id",
        siteName: "Personal Finance Management",
        title: "Personal Finance - Track Income, Expenses & Budgets",
        description:
            "Track income, expenses, budgets, and savings goals in one place.",
        locale: "id-ID",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Personal Finance Management",
                type: "image/jpeg",
            },
        ],
        countryName: "Indonesia",
        emails: ["contact@iarty.id"],
    },

    // Twitter card metadata
    twitter: {
        card: "summary_large_image",
        title: "Personal Finance - Track Income & Budgets",
        description:
            "Manage your money with budgets, goals, and clear reports.",
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
