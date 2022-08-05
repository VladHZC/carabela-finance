import	React, {ReactElement}										from	'react';
import	Image														from	'next/image';
import	{ethers}													from	'ethers';
import	{AddressWithActions, Card}									from	'@yearn-finance/web-lib/components';
import	{parseMarkdown, toAddress, format, performBatchedUpdates}	from	'@yearn-finance/web-lib/utils';
import	{useWeb3}													from	'@yearn-finance/web-lib/contexts';
import	useWallet													from	'contexts/useWallet';
import	type {TVault}												from	'contexts/useYearn.d';

/* 🔵 - Yearn Finance **********************************************************
** The OverviewCard component is a simple card used to display some relevant
** info about the vault. Name, address, shares and balances, description and 
** price are the current one, but we could imagine any cool info there.
******************************************************************************/
function	OverviewCard({currentVault, address}: {currentVault?: TVault, address: string}): ReactElement {
	const	{isActive} = useWeb3();
	const	{balances, prices, useWalletNonce} = useWallet();
	const	[shareOfVault, set_shareOfVault] = React.useState(ethers.constants.Zero);
	const	[balanceOfToken, set_balanceOfToken] = React.useState(ethers.constants.Zero);
	const	[priceOfVault, set_priceOfVault] = React.useState(ethers.constants.One);

	/* 🔵 - Yearn Finance ******************************************************
	** This useEffect trigget the set and reset of the local state. We grab the
	** user's wallet information to get all the relevant data (share, balance).
	** Please note the use of useWalletNonce to refresh data. See react deep
	** effect for more info.
	**************************************************************************/
	React.useEffect((): (() => void) => {
		performBatchedUpdates((): void => {
			set_shareOfVault(format.BN(balances[toAddress(address)]?.raw));
			set_balanceOfToken(format.BN(balances[toAddress(currentVault?.token?.address)]?.raw));
			set_priceOfVault(format.BN(prices[toAddress(address)]?.raw));
		});
		return (): void => {
			performBatchedUpdates((): void => {
				set_shareOfVault(ethers.constants.Zero);
				set_balanceOfToken(ethers.constants.Zero);
				set_priceOfVault(ethers.constants.One);
			});
		};
	}, [balances, isActive, prices, address, currentVault?.token?.address, useWalletNonce]);


	/* 🔵 - Yearn Finance ******************************************************
	** Based on the amount inputed and the prices of vault, determine the
	** expected shares to receive if the user deposits `amount` tokens.
	** This function is set in a callback for performance reasons.
	**************************************************************************/
	const	getShareValue = React.useCallback((): string => {
		const	_amount = format.toNormalizedValue(shareOfVault, currentVault?.decimals || 18);
		const	_price = format.toNormalizedValue(priceOfVault, currentVault?.decimals || 18);
		const	_value = (_amount * _price);
		if (Number(_value) === 0) {
			return ('-');
		}
		return (`${format.amount(_value)} $`);
	}, [shareOfVault, currentVault?.decimals, priceOfVault]);

	const renderBalance = (balance: any, label: string): ReactElement => (
		<div>
			<p className={'text-sm text-white'}>{label}</p>
			<b className={'text-lg'}>
				{balance.isZero() ? '-' : format.bigNumberAsAmount(
					balance,
					currentVault?.decimals,
					2
				)}
			</b>
		</div>
	);

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	return (
		<Card className={'col-span-1 p-4 text-white md:col-span-3'}>
			<div className={'mb-6 flex flex-row items-start space-x-6 p-4 text-white'}>
				{currentVault?.token?.icon ? <Image
					src={currentVault?.token?.icon || ''}
					width={80}
					height={80}
					className={'min-w-[80px]'} /> : <div className={'h-[80px] w-[80px] rounded-full bg-neutral-0'} />}
				<div>
					<h2 className={'-mt-1 -mb-2 text-xl font-bold  text-white md:text-5xl'}>
						{currentVault?.name || ''}
					</h2>
					<AddressWithActions
						className={'text-sm font-normal text-white'}
						address={toAddress(address)} />
				</div>

			</div>
			<div className={'mb-4 space-y-2 p-4'}>
				<b>{'About'}</b>
				<p
					dangerouslySetInnerHTML={{__html: parseMarkdown(currentVault?.description || '')}} />
			</div>
			<div className={'grid grid-cols-2 gap-2 md:grid-cols-4 p-4'}>
				{renderBalance(balanceOfToken, 'Your token balance')}
				{renderBalance(shareOfVault, 'Your vault shares')}
				<div>
					<p className={'text-xs text-white'}>{'Your shares value'}</p>
					<b className={'text-lg'}>
						{getShareValue()}
					</b>
				</div>
			</div>
		</Card>
	);
}

export default OverviewCard;