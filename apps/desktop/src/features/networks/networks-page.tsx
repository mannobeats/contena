import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { useContainers } from "@/features/containers/api";
import type { NetworkSummary } from "@/lib/ipc/bindings";
import { useSelection } from "@/lib/use-selection";
import { Crumb, Page } from "@/shell/page";
import { BulkDelete } from "@/ui/bulk-delete";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { ListSection } from "@/ui/list-section";
import { Lede, PageHeading } from "@/ui/page-heading";
import { useRowOrder } from "@/ui/table-layout";

import { useNetworks, useRemoveNetworks } from "./api";
import { DeleteNetworkSheet } from "./delete-network-sheet";
import { matchesNetwork, undeletable } from "./model";
import { NETWORKS_TABLE, networkColumns } from "./network-columns";
import { NetworkTable } from "./network-table";
import { NewNetworkSheet } from "./new-network-sheet";

export function NetworksPage() {
  const { data: networks } = useNetworks();
  const { data: containers } = useContainers();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<NetworkSummary | null>(null);
  const all = networks ?? [];
  const own = all.filter((network) => !network.builtIn).length;
  const visible = all.filter((network) => matchesNetwork(network, query));
  const columns = networkColumns(containers ?? []);
  const order = useRowOrder(NETWORKS_TABLE, columns);
  const selection = useSelection(
    order(visible)
      .filter((network) => !undeletable(network))
      .map((network) => network.id),
  );
  const chosen = visible.filter((network) => selection.has(network.id));
  const removeMany = useRemoveNetworks();
  return (
    <Page crumbs={<Crumb>Networks</Crumb>}>
      <PageHeading
        title="Networks"
        action={
          <Button variant="brand" onClick={() => setCreating(true)}>
            <IconPlus />
            New network
          </Button>
        }
      >
        <Lede>
          {own} project {own === 1 ? "network" : "networks"} and {all.length - own} built in.
          Containers on the same network reach each other by service name.
        </Lede>
      </PageHeading>
      <ListSection query={query} onQuery={setQuery} placeholder="Filter networks">
        {networks && visible.length === 0 ? (
          <EmptyState title="No networks match" />
        ) : (
          <NetworkTable
            networks={visible}
            columns={columns}
            onDelete={setDeleting}
            selection={selection}
          />
        )}
      </ListSection>
      <BulkDelete
        selection={selection}
        chosen={chosen}
        noun="network"
        name={(network) => network.name}
        onDelete={(items) => removeMany.mutate(items)}
      >
        Containers created later can't join them by name. This can't be undone.
      </BulkDelete>
      {creating ? (
        <NewNetworkSheet
          open
          taken={all.map((network) => network.name)}
          onClose={() => setCreating(false)}
        />
      ) : null}
      <DeleteNetworkSheet network={deleting} onClose={() => setDeleting(null)} />
    </Page>
  );
}
