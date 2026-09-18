import MetadataConfig from "@/config/Metadata"
import type { ReactNode } from "react"
import { Helmet } from "react-helmet-async"

interface HelmetContainerProps {
    children?: ReactNode;
    title?: string;
}

function HelmetContainer({ children, title }: HelmetContainerProps) {
    const seoTitle = title || MetadataConfig.title;

    return (
        <Helmet>
            {/* Basic Metadata */}
            {title && <title>{title}</title>}
            {children}
            <meta name="description" content={MetadataConfig.description} />
            <meta name="keywords" content={MetadataConfig.keywords.join(', ')} />
            <meta name="author" content={MetadataConfig.authors.name} />
            <link rel="canonical" href={MetadataConfig.openGraph.url} />
            <meta name="theme-color" content="#ffffff" />

            {/* 2. Robots */}
            <meta
                name="robots"
                content={`${MetadataConfig.robots.index ? 'index' : 'noindex'}, ${MetadataConfig.robots.follow ? 'follow' : 'nofollow'}`}
            />

            {/* 3. Open Graph (Facebook, WhatsApp, LinkedIn) */}
            <meta property="og:type" content={MetadataConfig.openGraph.type} />
            <meta property="og:title" content={seoTitle} />
            <meta property="og:description" content={MetadataConfig.openGraph.description} />
            <meta property="og:url" content={MetadataConfig.openGraph.url} />
            <meta property="og:site_name" content={MetadataConfig.openGraph.siteName} />
            <meta property="og:locale" content={MetadataConfig.openGraph.locale} />
            <meta property="og:image" content={MetadataConfig.openGraph.images[0].url} />
            <meta property="og:image:width" content={MetadataConfig.openGraph.images[0].width.toString()} />
            <meta property="og:image:height" content={MetadataConfig.openGraph.images[0].height.toString()} />

            {/* 4. Twitter / X Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seoTitle} />
            <meta name="twitter:description" content={MetadataConfig.openGraph.description} />
            <meta name="twitter:image" content={MetadataConfig.openGraph.images[0].url} />

            {/* 5. Icons */}
            <link
                rel="icon"
                type="image/x-icon"
                href={MetadataConfig.icons.icon[0]?.url || "/favicon.ico"}
            />

            <link
                rel="apple-touch-icon"
                href={MetadataConfig.icons.apple[0]?.url}
            />
        </Helmet>
    )
}

export default HelmetContainer