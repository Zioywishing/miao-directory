import { api } from "../config.js";
import useFsOprateEventCenter from "../hooks/useFsOprateEventCenter.js";

const fsOprateEventCenter = useFsOprateEventCenter();

export default function useQueryApi(app) {
	app.get(api.query, (req, res) => {
		const id = req.query.id;
		res.json(fsOprateEventCenter.query(id));
	});
}
