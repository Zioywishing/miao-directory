import { reactive } from "vue";

let dataStorage: {
	[key: string | number] : any
};

export default function useDataBus() {
	if(dataStorage === undefined) {
		dataStorage = reactive({})
	}
	return {
		set(key: string | number, value: any) {
			dataStorage[key] = value;
			return value;
		},
		pop(key: string | number) {
			const value = dataStorage[key];
			dataStorage[key] = undefined;
			return value;
		}
	};
}
