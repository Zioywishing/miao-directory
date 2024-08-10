type miaoFetchConfig = {
	retry: number;
};

export default function useMiaoFetch(config: miaoFetchConfig) {
	const { retry } = config;

	return async (input: RequestInfo | URL, init?: RequestInit) => {
		let retryTimes = 0;
		let err: any;
		while (retryTimes <= retry) {
			try {
				const response = await fetch(input, init);
				return response;
			} catch (e) {
				err = e;
				retryTimes += 1;
			}
		}
		throw err;
	};
}
