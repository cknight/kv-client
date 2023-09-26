import { CONNECTIONS_KEY_PREFIX, KvConnection } from "../types.ts";

interface ConnectionListProps {
  connections: KvConnection[];
}

export function ConnectionList(props: ConnectionListProps) {

  return (
    <div>
      <table class="table-auto">
        <thead class="bg-gray-200">
          <tr>
            <th class="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
            <th class="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Connection</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="mt-3 bg-[#f5f5f5] dark:bg-[#454545] divide-y divide-slate-800 dark:divide-[#656565]">
          {props.connections.map(connection => (
            <tr>
              <td>{connection.name}</td>
              <td>{connection.kvLocation}</td>
              <td>
                <div>
                  <button>Edit</button>
                  <button>Delete</button>
                  <button>Test</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}