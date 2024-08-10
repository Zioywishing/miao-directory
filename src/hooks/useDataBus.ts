const dataStorage: any = {};

export default function useDataBus() {
	return {
		set(key: string | number, value: any) {
			dataStorage[key] = value;
			return value;
		},
		get(key: string | number) {
			const value = dataStorage[key];
			dataStorage[key] = undefined;
			return value;
		}
	};
}
