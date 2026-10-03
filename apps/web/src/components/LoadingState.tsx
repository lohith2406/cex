import { Spinner } from "./ui/spinner";

export function LoadingState() {
    return (
        <div className="flex justify-center p-6">
            <Spinner />
        </div>
    );
}