"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Users,
  Download,
  MessageSquare,
} from "lucide-react";

type ClientProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  city: string | null;
  tags: string[];
  notes: string | null;
  totalEventsBooked: number;
  preferredLanguage: string | null;
};

function ClientCard({ client }: { client: ClientProfile }) {
  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{client.name}</h3>
          </div>
          <div className="flex gap-1">
            {client.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
          {client.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {client.phone}
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {client.email}
            </div>
          )}
          {client.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {client.city}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {client.totalEventsBooked ?? 0} events
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientsManagement() {
  const [search, setSearch] = useState("");

  const { data: clientsData, isLoading } = api.clients.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const { data: segments } = api.clients.getSegments.useQuery({});

  const clients = (clientsData?.clients ?? []) as ClientProfile[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Segments */}
      {segments && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{segments.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{segments.vip}</div>
              <div className="text-xs text-muted-foreground">VIP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{segments.corporate}</div>
              <div className="text-xs text-muted-foreground">Corporate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{segments.repeat}</div>
              <div className="text-xs text-muted-foreground">Repeat</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{segments.newClients}</div>
              <div className="text-xs text-muted-foreground">New</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client List */}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No clients found</p>
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first client
            </Button>
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        )}
      </div>
    </div>
  );
}
