from rest_framework import serializers
from .models import *

class AnneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableAnnee
        fields = '__all__'

class NiveauSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableNiveau
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableOption
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableRole
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TablePermission
        fields = '__all__'

class UtilisateurSerializer(serializers.ModelSerializer):
    role_nom = serializers.ReadOnlyField(source='role.role')
    
    class Meta:
        model = TableUtilisateur
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}} # Sécurité : ne jamais renvoyer le mdp

class EleveSerializer(serializers.ModelSerializer):
    # Les champs calculés (fullname, date_naissance) sont automatiquement inclus 
    # car ils sont définis dans le save() ou comme propriétés
    class Meta:
        model = TableEleve
        fields = '__all__'
        read_only_fields = ('matricule', 'fullname', 'date_naissance')

class ClasseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableClasse
        fields = ['id', 'code_classe', 'lib_classe', 'niveau_classe', 'option_classe']

class FraisScolariteSerializer(serializers.ModelSerializer):
    classe_libelle = serializers.ReadOnlyField(source='classe_fs.lib_classe')
    annee_libelle = serializers.ReadOnlyField(source='annee_fs.annee_scolaire')

    class Meta:
        model = TableFraisScolarite
        fields = '__all__'

class AffectationSerializer(serializers.ModelSerializer):
    eleve_details = EleveSerializer(source='eleve_aff', read_only=True)
    classe_nom = serializers.ReadOnlyField(source='classe_aff.lib_classe')
    annee_nom = serializers.ReadOnlyField(source='annee_aff.annee_scolaire')
    niveau_classe = serializers.ReadOnlyField(source='classe_aff.niveau_classe')
    option_classe = serializers.ReadOnlyField(source='classe_aff.option_classe')
    affectation_id = serializers.ReadOnlyField(source='id')

    class Meta:
        model = TableAffectation
        fields = '__all__'
        depth = 0

class RecouvrementSerializer(serializers.ModelSerializer):
    # 1. DÉCLARER LE CHAMP ICI (C'est ce qui manque !)
    affectation_details = serializers.SerializerMethodField()
    affectation_id = serializers.ReadOnlyField(source='affectation.id')
     # Expose à plat pour le front :
    annee_nom = serializers.ReadOnlyField(source='affectation.annee_aff.annee_scolaire')
    classe_nom = serializers.ReadOnlyField(source='affectation.classe_aff.lib_classe')
    niveau_classe = serializers.ReadOnlyField(source='affectation.classe_aff.niveau_classe')
    option_classe = serializers.ReadOnlyField(source='affectation.classe_aff.option_classe')
    eleve_id = serializers.ReadOnlyField(source='affectation.eleve_aff.id')
    info_eleve = serializers.ReadOnlyField(source='affectation.eleve_aff.fullname')
    info_matricule = serializers.ReadOnlyField(source='affectation.eleve_aff.matricule')
    info_classe = serializers.ReadOnlyField(source='affectation.classe_aff.lib_classe')
    # Harmoniser les noms des montants:
    frais_total = serializers.ReadOnlyField(source='frais_paiement')
    montant_paye = serializers.ReadOnlyField(source='total_paye')

    class Meta:
        model = TableRecouvrement
        fields = '__all__' # affectation_details sera inclus automatiquement ici
        read_only_fields = ('tranche1_paiement', 'tranche2_paiement', 'tranche3_paiement')
        
    def get_affectation_details(self, obj):
        if obj.affectation and obj.affectation.eleve_aff:
            return {
                "eleve_fullname": obj.affectation.eleve_aff.fullname,
                "eleve_matricule": obj.affectation.eleve_aff.matricule,
                "annee_nom": obj.affectation.annee_aff.annee_scolaire if obj.affectation.annee_aff else "",
                "classe_lib": obj.affectation.classe_aff.lib_classe if obj.affectation.classe_aff else "",
            }
        return None
