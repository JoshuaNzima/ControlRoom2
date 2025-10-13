// Use require to avoid TypeScript circular import alias checks when shimming a JSX file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TicketList: any = require('./Index.jsx').default;
export default TicketList;
