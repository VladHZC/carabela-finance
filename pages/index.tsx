import	React, {ReactElement}	from	'react';
import	Image					from	'next/image';
import	Link					from	'next/link';
import	{motion}				from	'framer-motion';
import	{Card}			  from	'@yearn-finance/web-lib/components';
import	* as utils				from	'@yearn-finance/web-lib/utils';
import	useYearn				from	'contexts/useYearn';
import type {TVault}			from	'contexts/useYearn.d';
import	Filters					from	'components/Filters';

const getAPY = (apy: any): string => Number((apy * 100).toFixed(2)) === 0 ? '-' : `${utils.format.amount(apy * 100, 2, 2)}%`;

const getGrowth = (timePeriod: number): string => utils.format.amount(timePeriod * 100, 2, 2);

function	VaultCard({currentVault}: {currentVault: TVault}): ReactElement {
	const {address, token, apy, tvl} = currentVault;

	const growthList = [
		{label: 'Last 7 days', time: apy.points.week_ago},
		{label: 'Last 30 days', time: apy.points.month_ago},
		{label: 'All Time', time: apy.points.inception}
	];

	const renderTextRow = (label: string, val: string): ReactElement => (
		<div className={'flex flex-row items-center text-white'}>
			<div className={'mr-3 text-sm'}>{label}</div>
			<div className={'text-lg font-bold'}>{val}</div>
		</div>
	);
	const growth = (label: string, growthTime: number): ReactElement => (
		<div className={'flex flex-col'}>
			<p className={'text-xs text-neutral-400'}>{label}</p>
			<b className={'text-white text-md'}>{`${getGrowth(growthTime)}%`}</b>
		</div>
	);
	const renderGrowth = growthList.map(({label, time}): ReactElement => growth(label, time));

	return (
		<div className={'w-full'}>
			<Link href={`/vault/${address}`}>
				<Card className={'col-span-1 md:col-span-3 rounded-xl bg-black'}>
					<div className={'cursor-pointer px-6 pb-2 pt-4'}>
						<div className={'flex w-full flex-row items-start justify-between'}>
							<div className={'flex flex-col'}>
								<div className={'min-h-[32px] min-w-[32px] md:min-w-[80px]'}>
									<Image
										src={token.icon}
										width={60}
										height={60} />
								</div>
								<div>
									<h2 className={'text-md font-bold text-white md:text-2xl'}>
										{token.display_name || token.name}
									</h2>
								</div>
							</div>
							<div className={'flex flex-col'}>
								{renderTextRow('APY', getAPY(apy.net_apy))}
								{renderTextRow('TVL', `$${utils.format.amount(tvl.tvl / 1000_000, 2, 2)}m`)}
								<div className={'mt-1'}>
									<button className={'min-w-[140px] rounded-sm h-7 text-black bg-white'}>
										{'Details'}
									</button>
								</div>
							</div>
						</div>
					</div>

					<div className={'macarena--vaultCard space-y-6'}>
						<div>
							<div className={'text-md bg-neutral-700 p-2 pl-4 w-full text-neutral-400'}>{'Annualized Growth'}</div>
							<div className={'mt-2 grid grid-cols-3 gap-4 px-6 pb-4 pt-2 rounded-xl'}>
								{renderGrowth}
							</div>
						</div>
					</div>
				</Card>
			</Link>
		</div>
	);
}

function	Vaults({vaults}: {vaults: TVault[]}): ReactElement {
	return (
		<div className={'grid grid-cols-1 gap-6 md:grid-cols-3'}>
			{
				vaults.map((currentVault: TVault): ReactElement => {
					return (
						<VaultCard key={currentVault.address} currentVault={currentVault} />
					);
				})
			}
		</div>
	);
}

function	Index(): ReactElement {
	const	{vaults, nonce: dataNonce, defaultCategories} = useYearn();
	const	[filteredVaults, set_filteredVaults] = React.useState<TVault[]>([]);
	const	[selectedCategory, set_selectedCategory] = React.useState('');

	/* 🔵 - Yearn Finance ******************************************************
	** This effect is triggered every time the vault list or the search term is
	** changed, or the delta selector is updated. It filters the pairs based on
	** that to only work with them.
	**************************************************************************/
	React.useEffect((): void => {
		let		_filteredVaults = [...vaults];
		if (selectedCategory !== '')
			_filteredVaults = _filteredVaults.filter((vault): boolean => vault.categories.includes(selectedCategory));
		_filteredVaults = _filteredVaults.sort((a, b): number => b.apy.net_apy - a.apy.net_apy);
		utils.performBatchedUpdates((): void => {
			set_filteredVaults(_filteredVaults);
		});
	}, [dataNonce, vaults, selectedCategory]);

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<div className={'z-0 w-full pb-10 md:pb-20'}>
			<Filters
				currentCategory={selectedCategory}
				availableCategories={defaultCategories}
				onSelect={(category: string): void => set_selectedCategory(category)} />

			<Vaults vaults={filteredVaults} />
		</div>
	);
}

export default Index;
