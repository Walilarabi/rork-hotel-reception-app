# Script SQL Supabase — Toutes les tables de l'application hôtelière

## Objectif

Créer un fichier contenant le **script SQL complet** à copier-coller dans le SQL Editor de Supabase pour créer toutes les tables nécessaires à l'application.

---

## Tables qui seront créées

### 🏨 Hôtels & Configuration
- **hotels** — Informations de l'hôtel (nom, adresse, téléphone, plan d'abonnement, statut)
- **hotel_billing** — Données de facturation (TVA, IBAN, mandat SEPA)
- **hotel_settings** — Paramètres configurables (délai de conservation objets trouvés, etc.)
- **hotel_floors** — Étages de l'hôtel

### 🛏️ Chambres
- **rooms** — Chambres (numéro, étage, type, statut, capacité, équipements, dotation)
- **reservations** — Réservations (client, dates, statut, source de réservation)
- **room_history** — Historique des actions par chambre

### 👥 Utilisateurs & Rôles
- **users** — Tous les utilisateurs (réception, gouvernante, femme de chambre, maintenance, direction, etc.)

### 🧹 Ménage (Housekeeping)
- **housekeeping_zones** — Zones de nettoyage par étage
- **housekeeping_assignments** — Affectations des femmes de chambre aux zones
- **room_cleaning_tasks** — Tâches de nettoyage planifiées
- **inspections** — Inspections de contrôle qualité par la gouvernante

### 🔧 Maintenance
- **maintenance_tasks** — Signalements et interventions de maintenance
- **maintenance_comments** — Commentaires sur les tâches
- **maintenance_costs** — Coûts des interventions (pièces, fournisseurs)
- **maintenance_types** — Types de maintenance périodique
- **maintenance_schedules** — Planning de maintenance préventive

### 📦 Objets trouvés
- **lost_found_items** — Objets trouvés (statut : déclaré, restitué, consigné)

### 🥐 Petit-déjeuner
- **breakfast_orders** — Commandes petit-déjeuner par chambre
- **breakfast_config** — Tarification et paramètres
- **breakfast_staff** — Personnel du service petit-déjeuner
- **breakfast_services** — Services enregistrés
- **breakfast_products** — Produits et fournisseurs

### 📊 Économat & Stocks
- **consumable_products** — Produits consommables (linge, accueil, minibar, ménage)
- **consumption_logs** — Consommations enregistrées par chambre
- **stock_movements** — Mouvements de stock (entrées, sorties, inventaire)

### ⭐ Satisfaction client
- **client_reviews** — Avis clients (chambre et petit-déjeuner)
- **quality_alerts** — Alertes qualité automatiques
- **recurring_issues** — Problèmes récurrents détectés

### 📋 Administration
- **admin_logs** — Journal d'audit des actions administratives
- **pms_configurations** — Configuration de connexion PMS

### 💳 Abonnements (Super Admin)
- **subscription_plans** — Plans d'abonnement disponibles
- **features** — Fonctionnalités par plan
- **addons** — Modules complémentaires
- **promotions** — Codes promotionnels
- **hotel_subscriptions** — Abonnements actifs des hôtels

---

## Sécurité incluse

- **Row Level Security (RLS)** activée sur toutes les tables
- Politiques d'accès par rôle (chaque utilisateur ne voit que les données de son hôtel)
- Index sur les colonnes fréquemment recherchées pour de bonnes performances

---

## Comment utiliser le script

1. Ouvrir **app.supabase.com** → votre projet
2. Cliquer sur **SQL Editor** dans le menu à gauche
3. Coller le script
4. Cliquer sur **Run**
5. Vérifier que toutes les tables apparaissent dans l'onglet **Table Editor**
