from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import datetime
from decimal import Decimal, InvalidOperation
import re
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import unicodedata
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password

# Create your models here.
class TableAnnee(models.Model):
    annee_scolaire = models.CharField(max_length=9, editable=False, verbose_name="Année scolaire")
    debut = models.IntegerField(verbose_name="Début")
    fin = models.IntegerField(verbose_name="Fin")

    def clean(self):
        super().clean()
        if self.debut and self.fin:
            if int(self.fin) <= int(self.debut) :
                raise ValidationError("L'année de fin doit être supérieur à l'année de début.")
            if int(self.fin) - int(self.debut) != 1:
                raise ValidationError("L'écart entre le début et la fin doit être de 1 an (ex: 2023-2024).")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        self.annee_scolaire = f"{self.debut}-{self.fin}"
        return super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Année scolaire"
        verbose_name_plural = "Années scolaires"
        ordering = ["-debut"]

    def __str__(self):
        return f'{self.annee_scolaire}'
      
class TableNiveau(models.Model):
    niveau = models.CharField(max_length=50, unique=True, verbose_name='Niveau')
    description = models.TextField(null=True, blank=True, verbose_name='Description')

    class Meta:
        verbose_name = "Niveau"
        verbose_name_plural = "Niveaux"

    def __str__(self):
        return self.niveau
    
class TableOption(models.Model):
    option = models.CharField(max_length=50, unique=True, verbose_name='Option')
    description = models.TextField(null=True, blank=True, verbose_name='Description')

    class Meta:
        verbose_name = "Option"
        verbose_name_plural = "Options"

    def __str__(self):
        return self.option
    
class TableRole(models.Model):
    role = models.CharField(max_length=50, unique=True, verbose_name='Rôle')
    description = models.TextField(null=True, blank=True, verbose_name='Description')

    class Meta:
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"

    def __str__(self):
        return self.role
    
class TablePermission(models.Model):
    permission = models.CharField(max_length=50, unique=True, verbose_name='permission')
    description = models.TextField(null=True, blank=True, verbose_name='Description')

    class Meta:
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"

    def __str__(self):
        return self.permission
    
class TableUtilisateur(models.Model):
    username = models.CharField(unique=True, verbose_name="Nom d'utilisateur")
    nom = models.CharField(max_length=50, null=True, blank=True, verbose_name="Nom")
    prenom = models.CharField(max_length=100, null=True, blank=True, verbose_name="Prénom(s)")
    fonction = models.CharField(max_length=100, null=True, blank=True)
    contact = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name="Email")
    password = models.CharField(max_length=128, verbose_name="Mot de passe")
    role = models.ForeignKey(TableRole, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Rôle")
    permission = models.ForeignKey(TablePermission, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Permission")
    statut_choix = [ ('On', 'Actif'), ('Off', 'Inactif') ]
    statut = models.CharField(max_length=3, choices=statut_choix, default='On',verbose_name='Statut')
    dateajout = models.DateField(auto_now_add=True, verbose_name="Date d'ajout")
    derniereconnection = models.DateTimeField(null=True, blank=True, verbose_name='Dernière connexion') 
    photo = models.ImageField(upload_to='photousers/', null=True, blank=True, verbose_name="photo")
    # Champs obligatoires pour Django Auth

    def save(self, *args, **kwargs):
        # Cette condition vérifie si le mot de passe n'est pas déjà haché
        # pour éviter de hacher un hachage (ce qui rendrait la connexion impossible)
        if self.password and not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.fonction})"
    
class TableEleve(models.Model):
    matricule = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="Matricule")
    nom = models.CharField(max_length=20, verbose_name="Nom")
    prenom1 = models.CharField(max_length=20, verbose_name="Premier prénom")
    prenom2 = models.CharField(max_length=20,null=True, blank=True, verbose_name="Second prénom")
    prenom3 = models.CharField(max_length=20,null=True, blank=True, verbose_name="Troisième prénom")
    fullname = models.CharField(null=True, blank=True, verbose_name="Nom complet")
    sexe_choix =[ ('F', 'Feminin'), ('M', 'Masculin'), ('O', 'Autre') ]
    sexe = models.CharField(max_length=1,choices=sexe_choix,default='O', verbose_name="Sexe")
    JOURS_CHOIX = [(i, str(i)) for i in range(0, 32)] # On utilise range(0, 32) pour inclure 0 et s'arrêter à 31
    jour_naissance = models.IntegerField(choices=JOURS_CHOIX, default=0, verbose_name="Jour")
    MOIS_CHOIX = [(i, str(i)) for i in range(0, 13)] # 2. Liste de 0 à 12
    mois_naissance = models.IntegerField(choices=MOIS_CHOIX, default=0, verbose_name="Mois")
    annee_actuelle = datetime.now().year # 3. On récupère l'année en cours
    annees = [(i, str(i)) for i in range(1970, annee_actuelle + 1)] # 3.1 On crée la liste de 1970 à maintenant
    ANNEES_CHOIX = [(0, '0000')] + annees # Le premier élément est la valeur stockée (0), le second est le texte affiché ("0000")
    annee_naissance = models.IntegerField(choices=ANNEES_CHOIX, default=0,help_text="Sélectionnez 0000 si l'année est inconnue",verbose_name="Année") # 4. On définit le champ avec default=0
    date_naissance = models.CharField(max_length=10, null=True, blank=True,verbose_name="Date de naissance")
    lieu_naissance = models.CharField(max_length=100, null=True, blank=True, verbose_name="Lieu de Naissance")
    pere = models.CharField(max_length=100,null=True,blank=True, verbose_name="Père")
    mere = models.CharField(max_length=100, null=True, blank=True,verbose_name="Mère")
    photo = models.ImageField(upload_to='photoeleves/%Y/%m/%d/', null=True, blank=True, verbose_name="Photo")
    dateajout = models.DateField(auto_now_add=True, verbose_name="Date d'ajout")

    def nettoyer_texte(self, texte):
        if not texte: return ""
        texte_normalise = unicodedata.normalize('NFD', texte)
        texte_propre = texte_normalise.encode('ascii', 'ignore').decode('utf-8')
        return re.sub(r'[^a-zA-Z]', '', texte_propre).upper()

    def save(self, *args, **kwargs):
        prenoms = [self.prenom1]

        if self.prenom2:
            prenoms.append(self.prenom2)
        if self.prenom3:
            prenoms.append(self.prenom3)

        self.fullname = f"{' '.join(prenoms)} {self.nom}".strip()

        j = str(self.jour_naissance).zfill(2)
        m = str(self.mois_naissance).zfill(2)
        a_full = str(self.annee_naissance).zfill(4)
        self.date_naissance = f"{j}/{m}/{a_full}"

        with transaction.atomic():
            # Sauvegarde initiale pour obtenir le PK
            is_new = self.pk is None
            super().save(*args, **kwargs)

            # Génération matricule seulement si nouvel élève
            if is_new and not self.matricule:

                n = self.nettoyer_texte(self.nom)[:2]
                p1 = self.nettoyer_texte(self.prenom1)[:2]

                res_lettres = n + p1

                if self.prenom2:
                    res_lettres += self.nettoyer_texte(self.prenom2)[:2]
                if self.prenom3:
                    res_lettres += self.nettoyer_texte(self.prenom3)[:2]

                res_date_naiss = f"{j}{m}{a_full[-2:]}"
                res_ordre = str(self.pk) # 🔥 utilisation du PK
                res_annee_ajout = str(datetime.now().year)[-2:]

                self.matricule = f"{res_lettres}{res_date_naiss}{self.sexe}{res_ordre}{res_annee_ajout}"

                super().save(update_fields=['matricule'])

    class Meta:
        verbose_name = "Elève"
        verbose_name_plural = "Elèves"
        ordering = ["prenom1"]

    def __str__(self):
        return f"{self.fullname} ({self.matricule})"
    
class TableClasse(models.Model):
    code_classe = models.CharField(max_length=10, unique=True, verbose_name="Code")
    lib_classe = models.CharField(max_length=50, verbose_name="Classe")
    niveau_choix = [('cre','Crèche'),('mat','Maternel'), ('pri','Primaire'),('clg','Collège'),('lyc','Lycée'),('aut','Autres')]
    niveau_classe = models.CharField(max_length=3, choices=niveau_choix, default='aut', null=True, blank=True, verbose_name="Niveau")
    option_choix = [('se','Sciences Expérimentales'),('sm','Sciences Mathématiques'), ('ss','Sciences Sociales'),('sc','Scientifiques'),('lit','Littéraires'),('aut','Autres')]
    option_classe = models.CharField(max_length=3, choices=option_choix, default='aut', null=True, blank=True, verbose_name="Option")

    class Meta:
        verbose_name = "Classe"
        verbose_name_plural = "Classes"

    def __str__(self):
        return f"{self.code_classe} {self.lib_classe}"

class TableFraisScolarite(models.Model):
    annee_fs = models.ForeignKey(TableAnnee, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Année scolaire")
    classe_fs = models.ForeignKey(TableClasse, on_delete=models.CASCADE, verbose_name="Classe")
    frais_annuel = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="Frais de scolaire")
    t1_fs = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="1ère Tranche")
    t2_fs = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="2ème Tranche")
    t3_fs = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="3ème Tranche")

    class Meta:
        verbose_name = "Frais de scolarité"
        verbose_name_plural = "Frais de scolarité"
    
    def __str__(self):
        return f"{self.annee_fs.annee_scolaire} {self.classe_fs.lib_classe} {self.frais_annuel} {self.t1_fs} {self.t2_fs} {self.t3_fs}"
    
class TableAffectation(models.Model):
    annee_aff = models.ForeignKey(TableAnnee, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Année scolaire")
    classe_aff = models.ForeignKey(TableClasse, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Classe")
    eleve_aff = models.ForeignKey(TableEleve, on_delete=models.CASCADE, verbose_name="Elève" )
    etat_choix = [('Nouv','Nouveau/elle'),('adm','Admis/e'), ('red','Redoublant/e'),('Cdt','Candidat/e libre'),('Aut','Autre')]
    etat_aff = models.CharField(max_length=5, choices=etat_choix, default='Aut', null=True, blank=True, verbose_name="Etat affectation")
    date_aff = models.DateTimeField(auto_now_add=True, verbose_name="Date affectation" )

    class Meta:
        verbose_name = "Affectation"
        verbose_name_plural = "Affectations"
        constraints = [
            models.UniqueConstraint(fields=['eleve_aff', 'classe_aff', 'annee_aff'], name='unique_affectation1'),
            models.UniqueConstraint(fields=['eleve_aff', 'annee_aff'], name='unique_affectation2'),
        ]


        ordering = ['-annee_aff', 'eleve_aff__prenom1']

    def __str__(self):
        return f"{self.eleve_aff.fullname} {self.eleve_aff.matricule} {self.classe_aff.lib_classe} {self.annee_aff.annee_scolaire}"

class TableRecouvrement(models.Model):
    statut_ar_choix = [('Ins', 'Inscription'),('Reins', 'Réinscription'),('Aut', 'Autre'),]
    affectation = models.ForeignKey(TableAffectation,on_delete=models.CASCADE, null=True, blank=True, verbose_name="Effectation")
    #date_paiement = models.DateTimeField(auto_now_add=True)
    statut_ar = models.CharField(max_length=5, choices=statut_ar_choix, default='Aut', null=True, blank=True, verbose_name="Statut")
    montant_statut_ar = models.DecimalField(max_digits=10, decimal_places=0, validators=[MinValueValidator(0)],default=0)
    # `reduction` is a percentage (0-100)
    reduction = models.DecimalField(max_digits=5, decimal_places=0, default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True, verbose_name="Reduction(%)")
    frais_paiement = models.DecimalField(max_digits=10, decimal_places=0, validators=[MinValueValidator(0)], null=True, blank=True, verbose_name="Frais" )
    tranche1_paiement = models.DecimalField(max_digits=10, decimal_places=0, validators=[MinValueValidator(0)], null=True, blank=True, verbose_name="1ère Tranche")
    tranche2_paiement = models.DecimalField(max_digits=10, decimal_places=0, validators=[MinValueValidator(0)], null=True, blank=True, verbose_name="2ème Tranche")
    tranche3_paiement = models.DecimalField(max_digits=10, decimal_places=0, validators=[MinValueValidator(0)], null=True, blank=True, verbose_name="3ème Tranche")
    tuteur_paiement = models.CharField(max_length=200, null=True, blank=True, verbose_name="Tuteur/trice")
    contact_tuteur_paiement = models.CharField(max_length=15, null=True, blank=True, verbose_name="Contact")
    adresse_tuteur_paiement = models.CharField(max_length=300, null=True, blank=True, verbose_name="Adresse")
    profession_tuteur_paiement = models.CharField(max_length=100, null=True, blank=True, verbose_name="Profession")
    total_paye = models.DecimalField(max_digits=10, decimal_places=0,default=0, validators=[MinValueValidator(0)], verbose_name="Total payé")
    v1 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 1")
    d1 = models.DateField(null=True, blank=True, verbose_name="Date v.1")
    v2 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 2")
    d2 = models.DateField(null=True, blank=True, verbose_name="Date v.2")
    v3 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 3")
    d3 = models.DateField(null=True, blank=True, verbose_name="Date v.3")
    v4 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 4")
    d4 = models.DateField(null=True, blank=True, verbose_name="Date v.4")
    v5 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 5")
    d5 = models.DateField(null=True, blank=True, verbose_name="Date v.5")
    v6 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 6")
    d6 = models.DateField(null=True, blank=True, verbose_name="Date v.6")
    v7 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 7")
    d7 = models.DateField(null=True, blank=True, verbose_name="Date v.7")
    v8 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 8")
    d8 = models.DateField(null=True, blank=True, verbose_name="Date v.8")
    v9 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 9")
    d9 = models.DateField(null=True, blank=True, verbose_name="Date v.9")
    v10 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 10")
    d10 = models.DateField(null=True, blank=True, verbose_name="Date v.10")
    v11 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 11")
    d11 = models.DateField(null=True, blank=True, verbose_name="Date v.11")
    v12 = models.DecimalField(max_digits=10, decimal_places=0, default=0, blank=True, verbose_name="Vers. 12")
    d12 = models.DateField(null=True, blank=True, verbose_name="Date v.12")

    class Meta:
        verbose_name = "Recouvrement"
        verbose_name_plural = "Recouvrements"
        constraints = [
            models.UniqueConstraint(fields=['affectation'], name='unique_rec'),
        ]

    def save(self, *args, **kwargs):
        if self.affectation and self.affectation.annee_aff and self.affectation.classe_aff:
            frais = TableFraisScolarite.objects.filter(
                annee_fs=self.affectation.annee_aff,
                classe_fs=self.affectation.classe_aff
            ).first()
    
            if frais:
                reduction = Decimal(self.reduction or 0) / Decimal(100)
                reduction = max(Decimal(0), min(Decimal(1), reduction))
                multiplier = Decimal(1) - reduction
    
                self.frais_paiement = frais.frais_annuel * multiplier
                self.tranche1_paiement = frais.t1_fs * multiplier
                self.tranche2_paiement = frais.t2_fs * multiplier
                self.tranche3_paiement = frais.t3_fs * multiplier
            else:
                print("❌ Aucun frais trouvé pour cette classe et année")
    
        else:
            print("❌ Affectation incomplète (année ou classe manquante)")
    
        # Total payé
        versements = [
            self.v1, self.v2, self.v3, self.v4, self.v5, self.v6,
            self.v7, self.v8, self.v9, self.v10, self.v11, self.v12
        ]
        self.total_paye = sum(v or Decimal(0) for v in versements)
    
        super().save(*args, **kwargs)

    
    def __str__(self):
        # On initialise avec une valeur par défaut sécurisée
        eleve_display = "Élève inconnu"
        classe_display = "Classe inconnue"
        matricule_display = "SANS-MATRICULE"

        if self.affectation and self.affectation.eleve_aff:
            eleve = self.affectation.eleve_aff
            eleve_display = eleve.fullname
            matricule_display = eleve.matricule
            
            if self.affectation.classe_aff:
                classe_display = self.affectation.classe_aff.lib_classe

        return f"Paiement de {eleve_display} - {matricule_display} / {classe_display} {self.affectation.annee_aff.annee_scolaire}"