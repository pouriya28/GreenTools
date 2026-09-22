import { RouterProvider } from "react-router-dom"
import { router } from "./app/router"
import { OperationVerificationDialog } from "@/features/auth/components/OperationVerificationDialog"

export default function App() {
	return (
		<>
			<RouterProvider router={router} />
			<OperationVerificationDialog />
		</>
	)
}