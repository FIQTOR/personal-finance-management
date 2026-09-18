type Props = {
    size?: number;
    classProps?: string;
}
const Loading = ({ size = 52, classProps }: Props) => {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-2 ${classProps}`}
        >
            <span className={`loader`} style={{ width: size, height: size }}></span>
            <span className="text-lg font-light animate-pulse delay-75">
                Please wait a moment...
            </span>
        </div>
    )
}

export default Loading