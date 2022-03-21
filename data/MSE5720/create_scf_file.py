SCF_BASE_FILE = """
&CONTROL

 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Si',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=10.1941d0,
 nat=2,
 ntyp=1,
 ecutwfc=30,
 occupations = 'fixed',
 use_all_frac = .true.,
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
Si 28.0855d0 Si_LDA.UPF

ATOMIC_POSITIONS (crystal)
Si 0.d0 0.d0 0.d0
Si 0.25d0 0.25d0 0.25d0

K_POINTS automatic
8 8 8 0 0 0

CELL_PARAMETERS alat
{0}d0 {1}d0 {2}d0
{3}d0 {4}d0 {5}d0
{6}d0 {7}d0 {8}d0
"""
def create_scf_file(matrix):
    return SCF_BASE_FILE.format(matrix[0,0], matrix[0,1], matrix[0,2], matrix [1,0], matrix[1,1], matrix[1,2], matrix[2,0], matrix[2,1], matrix[2,2])
