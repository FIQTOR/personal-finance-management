import { APP_NAME } from '@/constants';

const AppConfig = {
    appName: APP_NAME,
    exTitle: `| ${APP_NAME}`,
    nodeEnv: import.meta.env.VITE_NODE_ENV,
    baseApiUrl: import.meta.env.VITE_NODE_ENV !== 'production' ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_API_URL,
}

export default AppConfig