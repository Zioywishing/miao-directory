import { alertTipType } from "@/types/type";
import initPlugin from "./init/initPlugin";

export default async function init(globalAlertTip: alertTipType) {
	await initPlugin(globalAlertTip)
}
