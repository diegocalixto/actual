export { HomePage as Home } from '#components/home/HomePage';

export { Budget } from '#components/budget';

export { Schedules } from '#components/schedules';
export { Schedules as ScheduleEdit } from '#components/schedules';
// The subscriptions screen is a phone screen; wide layouts are redirected to
// Schedules before this entry is ever rendered.
export { Schedules as Subscriptions } from '#components/schedules';

export { GoCardlessLink } from '#components/gocardless/GoCardlessLink';

export { AccountsOverview as Accounts } from '#components/accounts/AccountsOverview';
export { Account } from '#components/accounts/Account';

export { ManageRulesPage as Rules } from '#components/ManageRulesPage';
export { ManageRulesPage as RuleEdit } from '#components/ManageRulesPage';
export { ManagePayeesPage as Payees } from '#components/payees/ManagePayeesPage';
export { ManagePayeesPage as PayeeEdit } from '#components/payees/ManagePayeesPage';
export { ManageTagsPage as Tags } from '#components/tags/ManageTagsPage';

export { BankSync } from '#components/banksync';

export { UserDirectoryPage } from '#components/admin/UserDirectory/UserDirectoryPage';

// Account component is currently used for uncategorized transactions view.
// Need to separate this to it's own component in the future.
export { Account as Category } from '#components/accounts/Account';
