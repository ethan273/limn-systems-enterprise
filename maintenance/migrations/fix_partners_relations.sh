#!/bin/bash

# Backup the schema file
cp prisma/schema.prisma prisma/schema.prisma.backup

# Find the line number just before @@index in users model
LINE_NUM=$(grep -n "@@index(\[instance_id\])" prisma/schema.prisma | grep "auth" | cut -d: -f1)

# Add the partner-related relations before the @@index lines in users model
sed -i.tmp "${LINE_NUM}i\\
  partners_portal_user                                                  partners?                           @relation(\"PartnerPortalUser\")\\
  partner_documents                                                     partner_documents[]\\
" prisma/schema.prisma

# Now update production_orders to add partners relation
# Find production_orders model and add the partners relation
sed -i.tmp '/model production_orders {/,/@@schema("public")/s/\(  manufacturers     manufacturers? @relation.*\)/  partners          partners? @relation("FactoryOrders", fields: [factory_id], references: [id], onDelete: SetNull, onUpdate: NoAction)/' prisma/schema.prisma

# Add partner_performance back-reference to partners model
sed -i.tmp '/model partners {/,/@@schema("public")/s/\(  documents             partner_documents\[\]\)/  documents             partner_documents[]\n  partner_performance   partner_performance[]/' prisma/schema.prisma

# Clean up temp file
rm prisma/schema.prisma.tmp

echo "Relations fixed successfully!"
